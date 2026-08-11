// src/screens/angkatan/ranksPdfViewerTemplate.js
const PDFJS_VERSION = '3.11.174';

// Visualiseur PDF vertical (empile toutes les pages, scroll interne) — contrairement
// au carrousel horizontal de HomepagePdfCard, ici on veut un défilement vertical simple.
export const buildRanksPdfViewerHtml = () => `
  <!DOCTYPE html>
  <html style="height: 100%; margin: 0;">
    <head>
      <meta charset="utf-8">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; background-color: #f1f5f9; overflow-y: auto; }
        #pages { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 16px; }
        canvas { box-shadow: 0 1px 6px rgba(0,0,0,0.18); background: #fff; }
      </style>
    </head>
    <body>
      <div id="pages"></div>
      <script>
        // Firefox restreint les Web Workers dans un document data: URI (origine
        // opaque) — le worker de pdf.js s'initialise alors à moitié et produit
        // des erreurs "invalid function id" silencieuses (PDF jamais rendu).
        // On désactive complètement le worker et on fait tourner pdf.js sur le
        // thread principal de l'iframe à la place. On pointe quand même
        // workerSrc vers le vrai fichier (jamais utilisé tant que disableWorker
        // est vrai) uniquement pour faire taire l'avertissement de dépréciation.
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js';
        pdfjsLib.disableWorker = true;

        function renderAllPagesVertical(pdfDoc) {
          window.parent.postMessage(JSON.stringify({ type: 'RENDER_START' }), '*');
          var pagesEl = document.getElementById('pages');
          pagesEl.innerHTML = '';
          var containerWidth = (pagesEl.clientWidth || 700) - 32; // moins le padding

          var chain = Promise.resolve();
          for (var p = 1; p <= pdfDoc.numPages; p++) {
            (function(pageNum) {
              chain = chain.then(function() {
                return pdfDoc.getPage(pageNum).then(function(page) {
                  var unscaled = page.getViewport({ scale: 1 });
                  var scale = containerWidth / unscaled.width;
                  var viewport = page.getViewport({ scale: scale });
                  var outputScale = window.devicePixelRatio || 1;

                  var canvas = document.createElement('canvas');
                  canvas.width = Math.floor(viewport.width * outputScale);
                  canvas.height = Math.floor(viewport.height * outputScale);
                  canvas.style.width = viewport.width + 'px';
                  canvas.style.height = viewport.height + 'px';
                  pagesEl.appendChild(canvas);

                  var renderContext = { canvasContext: canvas.getContext('2d'), viewport: viewport };
                  if (outputScale !== 1) {
                    renderContext.transform = [outputScale, 0, 0, outputScale, 0, 0];
                  }
                  return page.render(renderContext).promise;
                });
              });
            })(p);
          }
          chain.then(function() {
            window.parent.postMessage(JSON.stringify({ type: 'ALL_PAGES_RENDERED' }), '*');
          });
        }

        window.addEventListener('message', function(event) {
          var data = event.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { return; }
          }
          if (data.type === 'LOAD_PDF') {
            pdfjsLib.getDocument({ url: data.url, disableWorker: true }).promise.then(function(doc) {
              window.parent.postMessage(JSON.stringify({ type: 'PDF_LOADED' }), '*');
              renderAllPagesVertical(doc);
            }).catch(function(err) {
              window.parent.postMessage(JSON.stringify({ type: 'PDF_ERROR', message: String(err) }), '*');
            });
          }
        });
      </script>
    </body>
  </html>
`;

export const RANKS_PDF_VIEWER_SRC = `data:text/html;charset=utf-8,${encodeURIComponent(buildRanksPdfViewerHtml())}`;