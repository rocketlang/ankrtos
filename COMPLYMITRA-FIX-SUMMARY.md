# ComplyMitra Login Fix - Quick Summary

## The Problem
App bypasses login completely - goes directly to role selection wizard.

## Root Cause
`FirstTimeRedirect.tsx` navigates to `/select-role` or `/dashboard` WITHOUT checking authentication.

## The Fix (5-minute implementation)

### Step 1: Add Login Route
Edit `/root/ankr-compliance/apps/web/src/App.tsx`:

```tsx
// Add import at top
import { LoginPage } from './pages/LoginPage';

// Add route BEFORE line 73
<Route path="/login" element={<LoginPage />} />
<Route path="/" element={<FirstTimeRedirect />} />
```

### Step 2: Fix FirstTimeRedirect
Edit `/root/ankr-compliance/apps/web/src/components/FirstTimeRedirect.tsx`:

```tsx
export function FirstTimeRedirect() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 🔒 CHECK AUTH FIRST!
    const authToken = localStorage.getItem('auth_token');
    
    if (!authToken) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Rest of existing code...
    const hasSelectedRole = localStorage.getItem(ROLE_SELECTED_KEY) === 'true';
    if (hasSelectedRole) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/select-role', { replace: true });
    }
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Loading ComplyMitra...</p>
      </div>
    </div>
  );
}
```

### Step 3: Update LoginPage (Connect to Backend)
Edit `/root/ankr-compliance/apps/web/src/pages/LoginPage.tsx`:

Replace the mock login (lines 11-19) with real OTP flow:

```tsx
const [step, setStep] = useState<'email' | 'otp'>('email');
const [otp, setOtp] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    if (step === 'email') {
      // Send OTP
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { sendOTP(email: "${email}") { success message } }`
        })
      });
      
      const data = await response.json();
      if (data.data.sendOTP.success) {
        setStep('otp');
      } else {
        alert(data.data.sendOTP.message);
      }
    } else {
      // Verify OTP
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { verifyOTP(email: "${email}", otp: "${otp}") { token user { id name email } } }`
        })
      });
      
      const data = await response.json();
      if (data.data.verifyOTP.token) {
        localStorage.setItem('auth_token', data.data.verifyOTP.token);
        localStorage.setItem('user', JSON.stringify(data.data.verifyOTP.user));
        navigate('/dashboard');
      } else {
        alert('Invalid OTP');
      }
    }
  } catch (error) {
    alert('Login failed: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Step 4: Rebuild & Deploy

```bash
cd /root/ankr-compliance/apps/web
pnpm run build
sudo rm -rf /var/www/ankr-compliance/*
sudo cp -r dist/* /var/www/ankr-compliance/
sudo systemctl reload nginx
```

### Step 5: Test

```bash
node /root/test-complymitra.js
```

Expected results:
- ✅ Landing page works
- ✅ App redirects to /login
- ✅ Login form appears
- ✅ OTP flow works

## Verification Checklist

- [ ] Login route added to App.tsx
- [ ] Auth check added to FirstTimeRedirect
- [ ] LoginPage connected to backend OTP
- [ ] Build successful
- [ ] Deployed to /var/www/ankr-compliance
- [ ] Nginx reloaded
- [ ] Playwright tests pass
- [ ] Manual testing confirms login works

## Rollback Plan

If something breaks:
```bash
cd /root/ankr-compliance
git stash  # Save changes
git checkout HEAD -- apps/web/src/  # Revert to last commit
pnpm run build
sudo cp -r apps/web/dist/* /var/www/ankr-compliance/
```

---

**Total time**: ~15 minutes  
**Risk level**: Low (only frontend changes)  
**Downtime**: None (hot reload)
