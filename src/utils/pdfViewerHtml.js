const PDFJS_VERSION = '3.11.174';

const buildPdfViewerHtml = () => `
  <!DOCTYPE html>
  <html style="height: 100%; margin: 0;">
    <head>
      <meta charset="utf-8">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; background-color: #ffffff; overflow: hidden; }
        #viewport { width: 100%; height: 100%; overflow: hidden; position: relative; }
        #track {
          display: flex; height: 100%; will-change: transform; position: relative; z-index: 1;
          opacity: 0; transition: opacity 0.2s ease;
        }
        #track.ready { opacity: 1; }
        .pageSlide {
          flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
          box-sizing: border-box; overflow: hidden; visibility: hidden;
        }
        .pageSlide.activeSlide { visibility: visible; }
        canvas { display: block; }
        #dots {
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          display: flex; justify-content: center; align-items: center; gap: 6px;
          padding: 6px 10px; border-radius: 999px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          z-index: 5;
        }
        .dot {
          width: 8px; height: 8px; border-radius: 4px;
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(0,0,0,0.08);
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .dot.active { background: #f97316; border-color: #f97316; width: 22px; }
      </style>
    </head>
    <body>
      <div id="viewport">
        <div id="track"></div>
        <div id="dots"></div>
      </div>
      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js';

        var currentPdfDoc = null;
        var currentIndex = 0;
        var totalPages = 1;
        var autoSlideTimer = null;
        var slideWidthPx = 0;
        var slideHeightPx = 0;
        var resizeTimer = null;

        function renderAllPages(pdfDoc) {
          currentPdfDoc = pdfDoc;
          totalPages = pdfDoc.numPages;
          currentIndex = 0;
          buildDots(totalPages);
          layoutAndRenderAll();
          startAutoSlide();
        }

        function layoutAndRenderAll() {
          if (!currentPdfDoc) return;
          var viewportEl = document.getElementById('viewport');
          slideWidthPx = viewportEl.clientWidth || 800;

          var track = document.getElementById('track');
          track.classList.remove('ready');
          track.innerHTML = '';
          track.style.transitionProperty = 'opacity';
          track.style.width = (slideWidthPx * totalPages) + 'px';
          track.style.transform = 'translateX(-' + (currentIndex * slideWidthPx) + 'px)';

          for (var i = 0; i < totalPages; i++) {
            var slide = document.createElement('div');
            slide.className = 'pageSlide' + (i === currentIndex ? ' activeSlide' : '');
            slide.style.width = slideWidthPx + 'px';
            slide.style.height = slideHeightPx + 'px';
            slide.dataset.pageNum = i + 1;
            track.appendChild(slide);
          }

          window.parent.postMessage(JSON.stringify({ type: 'RENDER_START' }), '*');

          renderSinglePage(currentPdfDoc, 1).then(function() {
            window.parent.postMessage(JSON.stringify({ type: 'HEIGHT_READY', height: slideHeightPx }), '*');
            var pagePromises = [];
            for (var p = 2; p <= totalPages; p++) {
              pagePromises.push(renderSinglePage(currentPdfDoc, p));
            }
            Promise.all(pagePromises).then(function() {
              requestAnimationFrame(function() {
                track.style.transitionProperty = 'transform, opacity';
                track.classList.add('ready');
              });
              window.parent.postMessage(JSON.stringify({ type: 'ALL_PAGES_RENDERED' }), '*');
            });
          });
        }

        function renderSinglePage(pdfDoc, pageNum) {
          return pdfDoc.getPage(pageNum).then(function(page) {
            var unscaled = page.getViewport({ scale: 1 });
            var scale = slideWidthPx / unscaled.width;
            var viewport = page.getViewport({ scale: scale });
            if (pageNum === 1) slideHeightPx = viewport.height;

            var canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            var slide = document.querySelector('.pageSlide[data-page-num="' + pageNum + '"]');
            if (slide) {
              slide.innerHTML = '';
              slide.appendChild(canvas);
              slide.style.height = viewport.height + 'px';
            }
            return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
          });
        }

        function buildDots(count) {
          var dotsWrap = document.getElementById('dots');
          dotsWrap.innerHTML = '';
          if (count <= 1) return;
          for (var i = 0; i < count; i++) {
            var dot = document.createElement('div');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', (function(idx) {
              return function() { goToSlide(idx); restartAutoSlide(); };
            })(i));
            dotsWrap.appendChild(dot);
          }
        }

        function goToSlide(index) {
          currentIndex = ((index % totalPages) + totalPages) % totalPages;
          var track = document.getElementById('track');
          track.style.transform = 'translateX(-' + (currentIndex * slideWidthPx) + 'px)';
          var slides = track.children;
          for (var s = 0; s < slides.length; s++) {
            slides[s].classList.toggle('activeSlide', s === currentIndex);
          }
          var dots = document.getElementById('dots').children;
          for (var i = 0; i < dots.length; i++) {
            dots[i].className = 'dot' + (i === currentIndex ? ' active' : '');
          }
        }

        function startAutoSlide() {
          if (totalPages <= 1) return;
          stopAutoSlide();
          autoSlideTimer = setInterval(function() { goToSlide(currentIndex + 1); }, 5000);
        }
        function stopAutoSlide() {
          if (autoSlideTimer) clearInterval(autoSlideTimer);
          autoSlideTimer = null;
        }
        function restartAutoSlide() { stopAutoSlide(); startAutoSlide(); }

        function softResizeAll() {
          if (!currentPdfDoc) return;
          var viewportEl = document.getElementById('viewport');
          var newWidth = viewportEl.clientWidth || slideWidthPx;
          if (!newWidth || newWidth === slideWidthPx) return;
          var ratio = newWidth / slideWidthPx;
          slideWidthPx = newWidth;
          slideHeightPx = slideHeightPx * ratio;

          var track = document.getElementById('track');
          track.style.width = (slideWidthPx * totalPages) + 'px';
          track.style.transform = 'translateX(-' + (currentIndex * slideWidthPx) + 'px)';
          var slides = track.children;
          for (var i = 0; i < slides.length; i++) {
            slides[i].style.width = slideWidthPx + 'px';
            slides[i].style.height = slideHeightPx + 'px';
            var canvas = slides[i].querySelector('canvas');
            if (canvas) {
              canvas.style.width = slideWidthPx + 'px';
              canvas.style.height = slideHeightPx + 'px';
            }
          }
          window.parent.postMessage(JSON.stringify({ type: 'HEIGHT_READY', height: slideHeightPx }), '*');
        }

        window.addEventListener('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(softResizeAll, 100);
        });

        window.addEventListener('message', function(event) {
          var data = event.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { return; }
          }
          if (data.type === 'LOAD_PDF') {
            pdfjsLib.getDocument(data.url).promise.then(function(doc) {
              window.parent.postMessage(JSON.stringify({ type: 'PDF_LOADED', totalPages: doc.numPages }), '*');
              renderAllPages(doc);
            }).catch(function(err) {
              window.parent.postMessage(JSON.stringify({ type: 'PDF_ERROR', message: String(err) }), '*');
            });
          }
        });
      </script>
    </body>
  </html>
`;

export const PDF_VIEWER_SRC = `data:text/html;charset=utf-8,${encodeURIComponent(buildPdfViewerHtml())}`;