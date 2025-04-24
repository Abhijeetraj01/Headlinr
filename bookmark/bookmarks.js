
document.addEventListener('DOMContentLoaded', () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const bookmarksContainer = document.querySelector('.bookmarks-container');
  
    if (bookmarks.length === 0) {
      bookmarksContainer.innerHTML = '<p>No bookmarks found.</p>';
    } else {
      bookmarks.forEach(bookmark => {
        const card = document.createElement('div');
        card.classList.add('news-card'); // use same card class as news!
  
        card.innerHTML = `
          <div class="card-image">
            <img src="${bookmark.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="${bookmark.title}">
          </div>
          <div class="card-content">
            <h3 class="card-title">
              <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">${bookmark.title}</a>
            </h3>
            <p class="card-description">
              ${bookmark.description || 'No description available.'}
            </p>
          </div>
        `;
  
        bookmarksContainer.appendChild(card);
      });
    }
  });
  
  