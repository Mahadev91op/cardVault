import nodemailer from 'nodemailer';

// Configure Nodemailer Transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER || 'mahadevtanti191@gmail.com',
    pass: process.env.SMTP_PASS || 'phcxyxccdvglaukw'
  }
});

// Dynamic Base URL for production email action links
const getAppBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  return url.replace(/\/+$/, '');
};

/**
 * Send detailed email notification to Admin when a new order is placed with payment proof.
 * @param {Object} params
 * @param {Object} params.order - The created Order document
 * @param {Object} params.buyer - The Buyer user object (username, email)
 * @param {Object} params.card - The Card product object (name, type, entryFee)
 */
export async function sendOrderNotificationEmail({ order, buyer, card }) {
  try {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'mahadevtanti191@gmail.com';
    const orderIdShort = order._id.toString().slice(-6);

    const attachments = [];
    let hasScreenshot = false;

    // Check and parse payment screenshot for attachment
    if (order.paymentScreenshot && typeof order.paymentScreenshot === 'string') {
      const match = order.paymentScreenshot.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
        attachments.push({
          filename: `payment_receipt_${orderIdShort}.${extension}`,
          content: Buffer.from(match[2], 'base64'),
          cid: 'paymentScreenshotImg'
        });
        hasScreenshot = true;
      }
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; opacity: 0.85; font-size: 14px; }
    .content { padding: 28px 24px; }
    .alert-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
    .alert-title { color: #166534; font-weight: 700; font-size: 15px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .data-table tr { border-bottom: 1px solid #f1f5f9; }
    .data-table td { padding: 12px 6px; font-size: 14px; }
    .label { color: #64748b; font-weight: 600; width: 35%; }
    .value { color: #0f172a; font-weight: 700; width: 65%; }
    .utr-pill { background: #eef2ff; color: #4338ca; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 15px; border: 1px solid #c7d2fe; display: inline-block; }
    .amount-highlight { color: #059669; font-size: 20px; font-weight: 900; }
    .app-tag { background: #f8fafc; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; }
    .screenshot-section { margin-top: 24px; text-align: center; background: #0f172a; border-radius: 12px; padding: 16px; }
    .screenshot-preview { max-width: 100%; max-height: 400px; border-radius: 8px; object-fit: contain; }
    .btn-action { display: block; text-align: center; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin-top: 24px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>CardVault Payment Received</h1>
      <p>A buyer has submitted payment proof for verification</p>
    </div>

    <div class="content">
      <div class="alert-banner">
        <div>
          <div class="alert-title">🔔 Action Required: Verify Bank Deposit</div>
          <div style="font-size: 13px; color: #15803d; margin-top: 2px;">Check your UPI/Bank statement before releasing card credentials.</div>
        </div>
      </div>

      <table class="data-table">
        <tr>
          <td class="label">Order ID:</td>
          <td class="value">#${order._id}</td>
        </tr>
        <tr>
          <td class="label">Due Amount:</td>
          <td class="value amount-highlight">₹${order.pricePaid} INR</td>
        </tr>
        <tr>
          <td class="label">Submitted UTR:</td>
          <td class="value"><span class="utr-pill">${order.utrNumber || 'N/A'}</span></td>
        </tr>
        <tr>
          <td class="label">Buyer Username:</td>
          <td class="value">${buyer?.username || 'Buyer'}</td>
        </tr>
        <tr>
          <td class="label">Buyer Email:</td>
          <td class="value">${buyer?.email || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Payment App:</td>
          <td class="value"><span class="app-tag">${order.paymentApp || 'UPI'}</span></td>
        </tr>
        <tr>
          <td class="label">Sender UPI / Phone:</td>
          <td class="value">${order.senderUpiId || 'Not provided'}</td>
        </tr>
        <tr>
          <td class="label">Card Product:</td>
          <td class="value">${card?.name || 'Virtual Card'} (${card?.type || 'N/A'})</td>
        </tr>
        <tr>
          <td class="label">Order Time:</td>
          <td class="value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
        </tr>
      </table>

      ${hasScreenshot ? `
        <div style="font-weight: 700; margin-bottom: 8px; font-size: 14px;">📷 Attached Payment Receipt Screenshot:</div>
        <div class="screenshot-section">
          <img src="cid:paymentScreenshotImg" alt="Payment Receipt" class="screenshot-preview" />
        </div>
      ` : `
        <div style="font-size: 13px; color: #64748b; font-style: italic;">No screenshot file attached.</div>
      `}

      <a href="${getAppBaseUrl()}/admin" class="btn-action">
        Open Admin Dashboard to Verify & Release
      </a>
    </div>

    <div class="footer">
      CardVault Automated Anti-Fraud Notification System<br/>
      Sent securely to ${adminEmail}
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"CardVault Alert" <${process.env.SMTP_USER || 'mahadevtanti191@gmail.com'}>`,
      to: adminEmail,
      subject: `🔔 New Payment Alert! Order #${orderIdShort} - ₹${order.pricePaid} INR (UTR: ${order.utrNumber})`,
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin order notification email sent successfully! Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send order notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send celebratory email notification to Buyer when their order is approved and card released.
 * @param {Object} params
 * @param {Object} params.order - The Order document
 * @param {Object} params.buyer - The Buyer user object (username, email)
 * @param {Object} params.card - The Card product object (name, type, limit)
 * @param {Object} params.releasedCardDetails - The released card details (number, expiry, cvv)
 */
export async function sendOrderApprovedEmail({ order, buyer, card, releasedCardDetails }) {
  try {
    if (!buyer?.email) {
      console.warn('⚠️ No buyer email found, skipping approval email.');
      return { success: false, error: 'Buyer email missing' };
    }

    const orderIdShort = order._id.toString().slice(-6);
    const cardNum = releasedCardDetails?.number || '•••• •••• •••• ••••';
    // Format card number in 4-digit blocks
    const formattedCardNum = cardNum.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim();
    const expiry = releasedCardDetails?.expiry || 'N/A';
    const cvv = releasedCardDetails?.cvv || '•••';
    const brandName = (card?.type || 'Virtual').toUpperCase();
    const cardholderName = (releasedCardDetails?.cardHolder || buyer?.username || 'CARDHOLDER').toUpperCase();
    const dob = releasedCardDetails?.dob || '15/07/1994';
    const atmPin = releasedCardDetails?.atmPin || '1234';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 15px; font-weight: 500; }
    .content { padding: 30px 24px; background: #ffffff; }
    
    /* Virtual Card Display */
    .card-preview-box {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      border-radius: 16px;
      padding: 24px;
      color: #ffffff;
      box-shadow: 0 12px 24px rgba(67, 56, 202, 0.25);
      margin-bottom: 28px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      position: relative;
    }
    .card-brand-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .card-chip { width: 36px; height: 26px; background: linear-gradient(135deg, #fbbf24, #d97706); border-radius: 5px; }
    .card-brand-tag { font-size: 14px; font-weight: 800; letter-spacing: 1px; color: #f8fafc; }
    .card-number-display { font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; letter-spacing: 3px; margin-bottom: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .card-details-row { display: flex; justify-content: space-between; font-size: 12px; }
    .card-sub-label { color: #a5b4fc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .card-sub-value { font-weight: 700; font-family: 'Courier New', Courier, monospace; font-size: 13px; }

    /* Security Credential Table */
    .credentials-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .credentials-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #edf2f7; }
    .cred-label { color: #64748b; font-weight: 600; width: 40%; }
    .cred-val { color: #0f172a; font-weight: 700; width: 60%; }
    .cred-chip { font-family: 'Courier New', Courier, monospace; font-size: 15px; background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 6px; display: inline-block; font-weight: 700; }

    /* Notice & CTA */
    .safety-notice { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #1e40af; line-height: 1.5; margin-bottom: 24px; }
    .btn-action { display: block; text-align: center; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 15px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    .footer { text-align: center; padding: 22px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Payment Verified &amp; Card Released!</h1>
      <p>Hello ${buyer.username}, your virtual card is active and ready to use.</p>
    </div>

    <div class="content">
      <!-- Visual Card -->
      <div class="card-preview-box">
        <div class="card-brand-row">
          <div class="card-chip"></div>
          <div class="card-brand-tag">${brandName}</div>
        </div>
        <div class="card-number-display">${formattedCardNum}</div>
        <div class="card-details-row">
          <div>
            <div class="card-sub-label">Cardholder</div>
            <div class="card-sub-value">${cardholderName}</div>
          </div>
          <div>
            <div class="card-sub-label">Expires</div>
            <div class="card-sub-value">${expiry}</div>
          </div>
          <div>
            <div class="card-sub-label">CVV</div>
            <div class="card-sub-value">${cvv}</div>
          </div>
        </div>
      </div>

      <!-- Detail Specs -->
      <table class="credentials-table">
        <tr>
          <td class="cred-label">Order ID:</td>
          <td class="cred-val">#${order._id}</td>
        </tr>
        <tr>
          <td class="cred-label">Cardholder Name:</td>
          <td class="cred-val">${cardholderName}</td>
        </tr>
        <tr>
          <td class="cred-label">Date of Birth (DOB):</td>
          <td class="cred-val"><span class="cred-chip">${dob}</span></td>
        </tr>
        <tr>
          <td class="cred-label">Card Product:</td>
          <td class="cred-val">${card?.name || 'Virtual Card'} (${card?.type || 'N/A'})</td>
        </tr>
        <tr>
          <td class="cred-label">Card Limit:</td>
          <td class="cred-val" style="color: #059669; font-weight: 800;">${card?.limit || 'Standard'}</td>
        </tr>
        <tr>
          <td class="cred-label">Card Number:</td>
          <td class="cred-val"><span class="cred-chip">${formattedCardNum}</span></td>
        </tr>
        <tr>
          <td class="cred-label">Expiry Date:</td>
          <td class="cred-val"><span class="cred-chip">${expiry}</span></td>
        </tr>
        <tr>
          <td class="cred-label">CVV Security Code:</td>
          <td class="cred-val"><span class="cred-chip">${cvv}</span></td>
        </tr>
        <tr>
          <td class="cred-label">ATM PIN:</td>
          <td class="cred-val"><span class="cred-chip" style="background:#fef3c7; color:#92400e;">${atmPin}</span></td>
        </tr>
        <tr>
          <td class="cred-label">Fee Paid:</td>
          <td class="cred-val" style="color: #059669;">₹${order.pricePaid} INR</td>
        </tr>
      </table>

      <div class="safety-notice">
        <strong>🔒 Security Reminder:</strong> Keep your card number and CVV safe. You can access and copy your card details anytime from your CardVault dashboard.
      </div>

      <a href="${getAppBaseUrl()}/profile/orders" class="btn-action">
        Open My Card Vault
      </a>
    </div>

    <div class="footer">
      CardVault Instant Virtual Cards • Thank you for your business!<br/>
      If you have questions, reply directly to this email.
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"CardVault Cards" <${process.env.SMTP_USER || 'mahadevtanti191@gmail.com'}>`,
      to: buyer.email,
      subject: `🎉 Your Virtual Card is Ready! Order #${orderIdShort} Approved - CardVault`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order approved email sent to ${buyer.email}! Message ID:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send order approved email to buyer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send alert email notification to Buyer when their order payment is rejected.
 * @param {Object} params
 * @param {Object} params.order - The Order document
 * @param {Object} params.buyer - The Buyer user object (username, email)
 * @param {Object} params.card - The Card product object (name, type)
 * @param {string} params.rejectionReason - Reason why payment was rejected
 */
export async function sendOrderRejectedEmail({ order, buyer, card, rejectionReason }) {
  try {
    if (!buyer?.email) {
      console.warn('⚠️ No buyer email found, skipping rejection email.');
      return { success: false, error: 'Buyer email missing' };
    }

    const orderIdShort = order._id.toString().slice(-6);
    const reasonText = rejectionReason || 'Payment verification could not be completed. The transaction was not credited to our bank account.';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 15px; }
    .content { padding: 30px 24px; }
    
    /* Rejection Reason Card */
    .reason-box { background: #fff1f2; border: 1px solid #fecdd3; border-left: 5px solid #e11d48; border-radius: 8px; padding: 18px; margin-bottom: 24px; }
    .reason-title { color: #9f1239; font-weight: 800; font-size: 15px; margin-bottom: 6px; }
    .reason-desc { color: #be123c; font-size: 14px; line-height: 1.5; font-weight: 600; }

    /* Order Summary Table */
    .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .summary-table td { padding: 10px 6px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .lbl { color: #64748b; font-weight: 600; width: 40%; }
    .val { color: #0f172a; font-weight: 700; width: 60%; }

    /* Resolution Steps */
    .resolution-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
    .resolution-title { font-weight: 700; font-size: 14px; color: #334155; margin-bottom: 10px; }
    .resolution-list { margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6; }

    .btn-retry { display: block; text-align: center; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 15px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; }
    .footer { text-align: center; padding: 22px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Payment Verification Failed</h1>
      <p>Order #${orderIdShort} could not be approved</p>
    </div>

    <div class="content">
      <div class="reason-box">
        <div class="reason-title">⚠️ Reason for Rejection:</div>
        <div class="reason-desc">${reasonText}</div>
      </div>

      <table class="summary-table">
        <tr>
          <td class="lbl">Order ID:</td>
          <td class="val">#${order._id}</td>
        </tr>
        <tr>
          <td class="lbl">Card Selected:</td>
          <td class="val">${card?.name || 'Virtual Card'} (${card?.type || 'N/A'})</td>
        </tr>
        <tr>
          <td class="lbl">Submitted UTR:</td>
          <td class="val" style="font-family: monospace;">${order.utrNumber || 'N/A'}</td>
        </tr>
        <tr>
          <td class="lbl">Amount Due:</td>
          <td class="val">₹${order.pricePaid} INR</td>
        </tr>
      </table>

      <div class="resolution-card">
        <div class="resolution-title">💡 What should you do next?</div>
        <ol class="resolution-list">
          <li>Check your UPI payment app (PhonePe, Google Pay, Paytm) to confirm whether the money was actually debited.</li>
          <li>Ensure you copy the <strong>12-digit numeric UTR / Reference ID</strong> correctly without spaces.</li>
          <li>Upload an uncropped, clear screenshot showing the transaction status as "Successful".</li>
        </ol>
      </div>

      <a href="${getAppBaseUrl()}/#marketplace" class="btn-retry">
        Return to Marketplace &amp; Retry Checkout
      </a>
    </div>

    <div class="footer">
      CardVault Anti-Fraud Team<br/>
      If money was deducted from your account, please reply to this email with your bank statement.
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"CardVault Support" <${process.env.SMTP_USER || 'mahadevtanti191@gmail.com'}>`,
      to: buyer.email,
      subject: `⚠️ Update Regarding Your Order #${orderIdShort} - CardVault`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order rejection email sent to ${buyer.email}! Message ID:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send order rejection email to buyer:', error);
    return { success: false, error: error.message };
  }
}

