let files = window.initialFiles;
let speed = 1.5;

document.addEventListener('DOMContentLoaded', () => {
  createColumns();
  loadFiles();
});

function createColumns() {
  const container = document.getElementById('container');
  container.innerHTML = '';

  ['html', 'css', 'js'].forEach((type) => {
    const column = document.createElement('div');
    column.className = 'scroll-column';
    
    const firstFile = files[type][0];
    column.innerHTML = `
      <div class="banner">
        <span class="filename">${firstFile.name}</span>
        <span class="filetype">${type.toUpperCase()}</span>
      </div>
      ${files[type]
        .map(
          (file) =>
            `<pre><code id="${file.id}" class="language-${type}"></code></pre>`
        )
        .join('')}
    `;
    container.appendChild(column);
  });
}

function loadFiles() {
  const allFiles = [...files.html, ...files.css, ...files.js];
  const promises = allFiles.map((file) =>
    fetch(file.path)
      .then((res) => res.text())
      .then((code) => ({ id: file.id, code }))
      .catch((err) => ({ id: file.id, code: `/* Error: ${err.message} */` }))
  );

  Promise.all(promises).then((results) => {
    results.forEach(({ id, code }) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = code;
        hljs.highlightElement(el);
        el.style.display = 'none';
        el.style.position = 'relative';
        el.style.top = '0px';
      }
    });

    // Start auto-scroll per column
    document.querySelectorAll('.scroll-column').forEach((col, idx) => {
      const type = idx === 0 ? 'html' : idx === 1 ? 'css' : 'js';
      startAutoScroll(
        col,
        files[type].map(f => f.id),
        files[type].map(f => f.name),
        files[type].map(f => type.toUpperCase())
      );
    });
  });
}

function startAutoScroll(column, fileIds, filenames, filetypes) {
  const elements = fileIds.map(id => document.getElementById(id));
  const bannerFilename = column.querySelector('.filename');
  const bannerFiletype = column.querySelector('.filetype');
  let currentIndex = 0;
  let pos = 0;

  elements.forEach((el, i) => el.style.display = i === 0 ? 'block' : 'none');

  function scroll() {
    const currentElement = elements[currentIndex];
    const containerHeight = column.clientHeight - 30;
    pos += speed;

    currentElement.style.top = `-${pos}px`;

    if (pos >= currentElement.scrollHeight - containerHeight) {
      currentElement.style.display = 'none';
      currentElement.style.top = '0px';
      pos = 0;

      currentIndex = (currentIndex + 1) % elements.length;
      const nextEl = elements[currentIndex];
      nextEl.style.display = 'block';
      nextEl.style.top = '0px';

      bannerFilename.textContent = filenames[currentIndex];
      bannerFiletype.textContent = filetypes[currentIndex];
    }

    requestAnimationFrame(scroll);
  }

  scroll();
}
