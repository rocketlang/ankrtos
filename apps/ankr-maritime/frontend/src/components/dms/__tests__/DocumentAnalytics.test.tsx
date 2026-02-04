/**
 * DocumentAnalytics Component Tests
 * Phase 33: Document Management System
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { DocumentAnalytics } from '../DocumentAnalytics';

const mockGetAnalytics = vi.fn();
const mockGenerateThumbnail = vi.fn();
const mockGeneratePreview = vi.fn();
const mockAddWatermark = vi.fn();

const mocks = [
  {
    request: {
      query: require('../DocumentAnalytics').GET_DOCUMENT_ANALYTICS,
      variables: { documentId: 'doc123', days: 30 },
    },
    result: {
      data: {
        getDocumentAnalytics: {
          totalViews: 127,
          totalDownloads: 45,
          lastViewedAt: '2026-01-31T10:30:00Z',
          lastDownloadedAt: '2026-01-30T15:20:00Z',
          recentActivity: {
            days: 30,
            events: 89,
            byEventType: { view: 67, download: 22 },
            uniqueUsers: 12,
            dailyActivity: {
              '2026-01-31': 15,
              '2026-01-30': 23,
            },
          },
        },
      },
    },
  },
  {
    request: {
      query: require('../DocumentAnalytics').GENERATE_THUMBNAIL,
      variables: { documentId: 'doc123' },
    },
    result: {
      data: {
        generateThumbnail: 'https://minio.example.com/thumbnails/doc123_thumb.jpg',
      },
    },
  },
  {
    request: {
      query: require('../DocumentAnalytics').GENERATE_PREVIEW,
      variables: { documentId: 'doc123' },
    },
    result: {
      data: {
        generatePreview: 'https://minio.example.com/previews/doc123_preview.jpg',
      },
    },
  },
  {
    request: {
      query: require('../DocumentAnalytics').ADD_WATERMARK,
      variables: { documentId: 'doc123', watermarkText: 'CONFIDENTIAL' },
    },
    result: {
      data: {
        addWatermark: 'https://minio.example.com/watermarked/doc123_watermarked.pdf',
      },
    },
  },
];

describe('DocumentAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render component with header', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    expect(screen.getByText(/Document Analytics/i)).toBeInTheDocument();
  });

  test('should render Load Analytics button', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    expect(screen.getByText(/Load Analytics/i)).toBeInTheDocument();
  });

  test('should render days selector with options', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('30');
  });

  test('should load analytics on button click', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const loadButton = screen.getByText(/Load Analytics/i);
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('127')).toBeInTheDocument(); // Total views
      expect(screen.getByText('45')).toBeInTheDocument(); // Total downloads
    });
  });

  test('should display analytics metrics after loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    fireEvent.click(screen.getByText(/Load Analytics/i));

    await waitFor(() => {
      expect(screen.getByText(/Total Views/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Downloads/i)).toBeInTheDocument();
      expect(screen.getByText(/Recent Events/i)).toBeInTheDocument();
      expect(screen.getByText(/Unique Users/i)).toBeInTheDocument();
    });
  });

  test('should display formatted dates', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    fireEvent.click(screen.getByText(/Load Analytics/i));

    await waitFor(() => {
      expect(screen.getByText(/Last:/)).toBeInTheDocument();
    });
  });

  test('should change days selector', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '7' } });

    expect(select).toHaveValue('7');
  });

  test('should render Generate Thumbnail button', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    expect(screen.getByText(/Generate Thumbnail/i)).toBeInTheDocument();
  });

  test('should generate thumbnail on button click', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const thumbnailButton = screen.getByText(/Generate Thumbnail/i);
    fireEvent.click(thumbnailButton);

    await waitFor(() => {
      expect(screen.getByText(/View Thumbnail/i)).toBeInTheDocument();
    });
  });

  test('should render Generate Preview button', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    expect(screen.getByText(/Generate Preview/i)).toBeInTheDocument();
  });

  test('should generate preview on button click', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const previewButton = screen.getByText(/Generate Preview/i);
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/View Preview/i)).toBeInTheDocument();
    });
  });

  test('should render watermark input and button', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText(/Watermark text/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('CONFIDENTIAL');

    expect(screen.getByText(/Add Watermark/i)).toBeInTheDocument();
  });

  test('should update watermark text input', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText(/Watermark text/i);
    fireEvent.change(input, { target: { value: 'DRAFT' } });

    expect(input).toHaveValue('DRAFT');
  });

  test('should add watermark on button click', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const watermarkButton = screen.getByText(/Add Watermark/i);
    fireEvent.click(watermarkButton);

    await waitFor(() => {
      expect(screen.getByText(/Download Watermarked PDF/i)).toBeInTheDocument();
    });
  });

  test('should display loading state for analytics', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const loadButton = screen.getByText(/Load Analytics/i);
    fireEvent.click(loadButton);

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test('should display loading state for thumbnail', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const thumbnailButton = screen.getByText(/Generate Thumbnail/i);
    fireEvent.click(thumbnailButton);

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  test('should open thumbnail in new tab', async () => {
    window.open = vi.fn();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    fireEvent.click(screen.getByText(/Generate Thumbnail/i));

    await waitFor(() => {
      const link = screen.getByText(/View Thumbnail/i);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test('should show alert on empty watermark text', () => {
    window.alert = vi.fn();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText(/Watermark text/i);
    fireEvent.change(input, { target: { value: '' } });

    const watermarkButton = screen.getByText(/Add Watermark/i);
    fireEvent.click(watermarkButton);

    expect(window.alert).toHaveBeenCalledWith('Please enter watermark text');
  });

  test('should render advanced features section', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    expect(screen.getByText(/Advanced Features/i)).toBeInTheDocument();
  });

  test('should render all metric cards', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    fireEvent.click(screen.getByText(/Load Analytics/i));

    await waitFor(() => {
      expect(screen.getByText(/Total Views/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Downloads/i)).toBeInTheDocument();
      expect(screen.getByText(/Recent Events/i)).toBeInTheDocument();
      expect(screen.getByText(/Unique Users/i)).toBeInTheDocument();
    });
  });

  test('should display unique users count', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    fireEvent.click(screen.getByText(/Load Analytics/i));

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // Unique users
    });
  });

  test('should display recent events count', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentAnalytics documentId="doc123" />
      </MockedProvider>
    );

    fireEvent.click(screen.getByText(/Load Analytics/i));

    await waitFor(() => {
      expect(screen.getByText('89')).toBeInTheDocument(); // Recent events
    });
  });
});
