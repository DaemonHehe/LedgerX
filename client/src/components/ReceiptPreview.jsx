const dashedLine = '--------------------------------';
const barcodeImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="64" viewBox="0 0 280 64"><rect width="280" height="64" fill="none"/><g fill="black"><rect x="0" y="0" width="2" height="64"/><rect x="5" y="0" width="4" height="64"/><rect x="13" y="0" width="1" height="64"/><rect x="18" y="0" width="6" height="64"/><rect x="29" y="0" width="2" height="64"/><rect x="36" y="0" width="5" height="64"/><rect x="46" y="0" width="1" height="64"/><rect x="51" y="0" width="3" height="64"/><rect x="59" y="0" width="7" height="64"/><rect x="71" y="0" width="2" height="64"/><rect x="78" y="0" width="4" height="64"/><rect x="88" y="0" width="1" height="64"/><rect x="93" y="0" width="6" height="64"/><rect x="104" y="0" width="3" height="64"/><rect x="112" y="0" width="2" height="64"/><rect x="118" y="0" width="5" height="64"/><rect x="128" y="0" width="1" height="64"/><rect x="133" y="0" width="7" height="64"/><rect x="145" y="0" width="2" height="64"/><rect x="153" y="0" width="4" height="64"/><rect x="162" y="0" width="1" height="64"/><rect x="167" y="0" width="6" height="64"/><rect x="178" y="0" width="3" height="64"/><rect x="186" y="0" width="2" height="64"/><rect x="192" y="0" width="5" height="64"/><rect x="202" y="0" width="1" height="64"/><rect x="207" y="0" width="7" height="64"/><rect x="219" y="0" width="2" height="64"/><rect x="226" y="0" width="4" height="64"/><rect x="236" y="0" width="1" height="64"/><rect x="241" y="0" width="6" height="64"/><rect x="252" y="0" width="3" height="64"/><rect x="260" y="0" width="2" height="64"/><rect x="267" y="0" width="5" height="64"/><rect x="277" y="0" width="3" height="64"/></g></svg>';

const formatQty = (qty) => {
  const parsed = Number.parseInt(qty, 10) || 0;
  return String(parsed).padStart(2, '0');
};

const formatMoney = (value) => {
  const amount = Number.parseFloat(value) || 0;
  return amount.toFixed(2);
};

function ReceiptPreview({ receipt, totals }) {
  return (
    <div className="receipt-shell">
      <div id="receipt-preview" className="receipt-paper">
        <header className="receipt-header">
          <div className="receipt-logo" aria-label="Store logo">
            {receipt.logoUrl ? (
              <img src={receipt.logoUrl} alt="" />
            ) : (
              <div className="waveform" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
          )}
        </div>
        <h2>{receipt.storeName}</h2>
        <p>{receipt.receiptTitle}</p>
      </header>

        <div className="receipt-divider">{dashedLine}</div>

        <section className="receipt-meta">
          <p>
            <span>CUSTOMER</span>
            <strong>{receipt.customerName || 'WALK-IN CUSTOMER'}</strong>
          </p>
          <p>
            <span>ADDRESS</span>
            <strong>{receipt.customerAddress || 'NO ADDRESS PROVIDED'}</strong>
          </p>
          <p>
            <span>DATE</span>
            <strong>{receipt.orderDate}</strong>
          </p>
        </section>

        <div className="receipt-divider">{dashedLine}</div>

        <section>
          <div className="receipt-row receipt-table-head">
            <span>NO</span>
            <span>ITEM</span>
            <span>QTY</span>
            <span>AMT</span>
          </div>

          {receipt.items.map((item, index) => (
            <div className="receipt-row" key={item.id}>
              <span>{formatQty(index + 1)}</span>
              <span>{item.name}</span>
              <span>{formatQty(item.qty)}</span>
              <span>{formatMoney(Number(item.qty) * Number(item.price))}</span>
            </div>
          ))}
        </section>

        <div className="receipt-divider">{dashedLine}</div>

        <section className="receipt-totals">
          <p>
            <span>TOTAL ITEMS</span>
            <strong>{formatQty(totals.itemCount)}</strong>
          </p>
          <p>
            <span>GRAND TOTAL</span>
            <strong>${formatMoney(totals.grandTotal)}</strong>
          </p>
        </section>

        <div className="receipt-divider">{dashedLine}</div>

        <section className="receipt-meta">
          <p>
            <span>REMARK</span>
            <strong>{receipt.footerRemark}</strong>
          </p>
          <p>
            <span>PAYMENT</span>
            <strong>{receipt.paymentMethod}</strong>
          </p>
          <p>
            <span>AUTH</span>
            <strong>{receipt.authCode}</strong>
          </p>
        </section>

        <footer className="receipt-footer">
          <p>{receipt.footerMessage}</p>
          <img className="barcode-image" src={receipt.barcodeUrl || barcodeImage} alt="Barcode" />
        </footer>
      </div>
    </div>
  );
}

export default ReceiptPreview;
