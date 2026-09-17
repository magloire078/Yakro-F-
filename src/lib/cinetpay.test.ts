import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCinetPayConfig,
  initCinetPayPayment,
  checkCinetPayPaymentStatus,
} from './cinetpay';

const config = { apiKey: 'test-key', siteId: 'test-site' };

describe('getCinetPayConfig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns null when CINETPAY_API_KEY is missing', () => {
    delete process.env.CINETPAY_API_KEY;
    process.env.CINETPAY_SITE_ID = 'site';
    expect(getCinetPayConfig()).toBeNull();
  });

  it('returns null when CINETPAY_SITE_ID is missing', () => {
    process.env.CINETPAY_API_KEY = 'key';
    delete process.env.CINETPAY_SITE_ID;
    expect(getCinetPayConfig()).toBeNull();
  });

  it('returns the config when both vars are set', () => {
    process.env.CINETPAY_API_KEY = 'key';
    process.env.CINETPAY_SITE_ID = 'site';
    expect(getCinetPayConfig()).toEqual({ apiKey: 'key', siteId: 'site' });
  });
});

describe('initCinetPayPayment', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const baseParams = {
    transactionId: 'order-123',
    amount: 5000,
    description: 'Commande Yakro Fê',
    notifyUrl: 'https://example.com/api/webhooks/cinetpay',
    returnUrl: 'https://example.com/orders/track?id=order-123',
  };

  it('returns the payment URL and token on a successful init', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: '201',
        message: 'CREATED',
        data: {
          payment_token: 'tok_abc',
          payment_url: 'https://checkout.cinetpay.com/payment/abc',
        },
      }),
    });

    const result = await initCinetPayPayment(config, baseParams);

    expect(result).toEqual({
      success: true,
      data: {
        paymentUrl: 'https://checkout.cinetpay.com/payment/abc',
        paymentToken: 'tok_abc',
      },
    });
  });

  it('sends amount rounded to the nearest integer in XOF', async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: '201',
        data: { payment_token: 't', payment_url: 'https://x' },
      }),
    });

    await initCinetPayPayment(config, { ...baseParams, amount: 4999.6 });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.amount).toBe(5000);
    expect(body.currency).toBe('XOF');
    expect(body.transaction_id).toBe('order-123');
  });

  it('returns a typed failure when CinetPay responds with a non-201 code', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: '600', message: 'INVALID_AMOUNT' }),
    });

    const result = await initCinetPayPayment(config, baseParams);
    expect(result).toEqual({ success: false, error: 'INVALID_AMOUNT' });
  });

  it('returns a typed failure when the response is missing payment_url', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: '201', data: {} }),
    });

    const result = await initCinetPayPayment(config, baseParams);
    expect(result.success).toBe(false);
  });

  it('returns a typed failure on network error instead of throwing', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));

    const result = await initCinetPayPayment(config, baseParams);
    expect(result).toEqual({
      success: false,
      error: 'Impossible de contacter CinetPay pour le moment.',
    });
  });
});

describe('checkCinetPayPaymentStatus', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns ACCEPTED status on a confirmed payment', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: '00',
        message: 'SUCCES',
        data: { status: 'ACCEPTED', amount: 5000, payment_method: 'OM', operator_id: 'op123' },
      }),
    });

    const result = await checkCinetPayPaymentStatus(config, 'order-123');
    expect(result).toEqual({
      success: true,
      data: { status: 'ACCEPTED', amount: 5000, paymentMethod: 'OM', operatorId: 'op123' },
    });
  });

  it('returns REFUSED status on a failed payment', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: '627',
        message: 'TRANSACTION_CANCEL',
        data: { status: 'REFUSED' },
      }),
    });

    const result = await checkCinetPayPaymentStatus(config, 'order-123');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('REFUSED');
    }
  });

  it('defaults to UNKNOWN when data.status is absent', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: '00', data: {} }),
    });

    const result = await checkCinetPayPaymentStatus(config, 'order-123');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('UNKNOWN');
    }
  });

  it('returns a typed failure on network error instead of throwing', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'));

    const result = await checkCinetPayPaymentStatus(config, 'order-123');
    expect(result.success).toBe(false);
  });
});
