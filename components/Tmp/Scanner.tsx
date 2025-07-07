'use client';

import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Scanner() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, /* verbose= */ false);

    const success = (result: string) => {
      const resultElement = document.getElementById('result');
      if (resultElement) {
        resultElement.innerHTML = `
          <h2>Success!</h2>
          <p><a href="${result}" target="_blank">${result}</a></p>
        `;
      }
      scanner.clear();
      const reader = document.getElementById('reader');
      if (reader) reader.remove();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = (err: any) => {
      console.error(err);
    };

    scanner.render(success, error);
  }, []);

  return (
    <main>
      <div id="reader"></div>
      <div id="result"></div>

      <style jsx>{`
        main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        #reader {
          width: 600px;
        }
        #result {
          text-align: center;
          font-size: 1.5rem;
        }
      `}</style>
    </main>
  );
}
