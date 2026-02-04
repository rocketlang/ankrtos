# R1Soft Backup Fix - Ticket #1076800

**Server:** C3-8GB-127-216.48.185.29 (e2e-102-29)
**Date:** 2026-01-18
**Issue:** CDP Backup failing - HCP driver not detected

---

## Error

```
An exception occurred during the request. The replication driver was not detected
(detail: Could not find a suitable hcp-driver module for your system.
Please run "r1soft-setup --get-module" on your Agent to install one.)
```

---

## Root Cause

The HCP kernel driver module was compiled for an older kernel version and became incompatible after a kernel update to `6.8.0-90-generic`.

---

## System Information

| Property | Value |
|----------|-------|
| OS | Ubuntu 24.04.3 LTS (Noble Numbat) |
| Kernel | 6.8.0-90-generic |
| CDP Agent | R1Soft CDP Agent v6.18.3 build 67 |

```
$ uname -a
Linux e2e-102-29 6.8.0-90-generic #91-Ubuntu SMP PREEMPT_DYNAMIC Tue Nov 18 14:14:30 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux
```

---

## Resolution Steps

### Step 1: Remove old incompatible module

```bash
rm -f /lib/modules/r1soft/hcpdriver-cki-6.8.0-90-generic.ko
```

### Step 2: Fetch fresh module from R1Soft build server

```bash
serverbackup-setup --get-module
```

Output:
```
Building header archive ...
outfile = /tmp/headers188396630
headers = /usr/src/linux-headers-6.8.0-90-generic
Session ID: 233343226
Waiting to upload...
Uploading file...
Waiting in build queue...
Downloading module...
```

### Step 3: Load the new kernel module

```bash
insmod /lib/modules/r1soft/hcpdriver-cki-6.8.0-90-generic.ko
```

### Step 4: Restart CDP agent

```bash
/etc/init.d/cdp-agent restart
```

### Step 5: Verify

```bash
# Check module is loaded
$ lsmod | grep hcp
hcpdriver              86016  0

# Check service status
$ systemctl status cdp-agent
● cdp-agent.service - LSB: Starts R1Soft CDP Agent
     Active: active (exited)
```

---

## Result

- HCP driver module successfully loaded for kernel 6.8.0-90-generic
- CDP agent running
- Backup should now work - requested E2E to trigger test backup

---

## Attachments

- `kernel-tarball.tar.gz` - Kernel headers tarball (if custom module compilation needed)

---

## Contact

For follow-up, reference Ticket **#1076800**
