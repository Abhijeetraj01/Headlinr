
//Dark Mode Toggle
const storageKey = 'theme-preference';

const getColorPreference = () => {
  if (localStorage.getItem(storageKey)) {
    return localStorage.getItem(storageKey);
  } else {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
};

const theme = {
  value: getColorPreference(),
};

const onClick = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  setPreference();
};

const setPreference = () => {
  localStorage.setItem(storageKey, theme.value);
  reflectPreference();
};

const reflectPreference = () => {
  document.documentElement.setAttribute('data-theme', theme.value);
  document.querySelector('#theme-toggle')?.setAttribute('aria-label', theme.value);
};

reflectPreference();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#theme-toggle')?.addEventListener('click', onClick);
});

// Listen to system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches: isDark }) => {
  theme.value = isDark ? 'dark' : 'light';
  setPreference();
});


// Constants for News API

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const DEFAULT_COUNTRY = 'us';

let newsData = [];
let page = 1;
let currentCategory = '';

const newsContainer = document.getElementById('news-container');
const categoryButtons = document.querySelectorAll('.category-btn');
const navLinks = document.querySelectorAll('nav a');
const pageTitle = document.getElementById('page-title');
const currentYearElement = document.getElementById('current-year');
const searchInput = document.getElementById('searchInput');
const bookmarkLink = document.getElementById('bookmark-link');
const loadMoreBtn = document.getElementById('load-more-btn');

currentYearElement.textContent = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
  fetchNews();

  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      page = 1;
      currentCategory = category;

      categoryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.category === category) {
          link.classList.add('active');
        }
      });

      updatePageTitle(category);
      fetchNews(category);
    });
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const category = link.dataset.category;
      page = 1;
      currentCategory = category;

      navLinks.forEach(navLink => navLink.classList.remove('active'));
      link.classList.add('active');

      categoryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
          btn.classList.add('active');
        }
      });

      updatePageTitle(category);
      fetchNews(category);
    });
  });

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredArticles = newsData.filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      (article.description && article.description.toLowerCase().includes(searchTerm))
    );
    displayNews(filteredArticles);
  });

  loadMoreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    page++;
    fetchNews(currentCategory, true);
  });  
});

async function fetchApiKey() {
  try {
    const res = await fetch('/config');
    const data = await res.json();
    NEWS_API_KEY = data.apiKey;
  } catch (err) {
    console.error('Failed to load API key:', err);
  }
}

// Fetch News
async function fetchNews(category = '', append = false) {
  if (!append) {
    showLoading();
  }

  try {
    let url = `${NEWS_API_BASE_URL}/top-headlines?country=${DEFAULT_COUNTRY}&apiKey=${NEWS_API_KEY}&pageSize=9&page=${page}`;
    if (category) url += `&category=${category}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch news: ${response.status}`);

    const data = await response.json();

    if (data.status === 'ok' && data.articles) {
      if (append) {
        newsData = [...newsData, ...data.articles];
        appendNews(data.articles);
      } else {
        newsData = data.articles;
        displayNews(data.articles);
      }
    } else {
      throw new Error('Invalid data received from API');
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    newsData = getMockArticles(category);
    displayNews(newsData);
    showError('Could not load news from the API. Showing sample data instead.');
  }
}

// Display News
function displayNews(articles) {
  newsContainer.innerHTML = '';

  if (articles.length === 0) {
    newsContainer.innerHTML = '<div class="error-message">No articles found for this category.</div>';
    return;
  }

  articles.forEach(article => {
    const card = createNewsCard(article);
    newsContainer.appendChild(card);
  });
}

// Append News
function appendNews(articles) {
  articles.forEach(article => {
    const card = createNewsCard(article);
    newsContainer.appendChild(card);
  });
}

// Create News Card
function createNewsCard(article) {
  const card = document.createElement('div');
  card.className = 'news-card';

  const publishedDate = new Date(article.publishedAt);
  const formattedDate = publishedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = publishedDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  card.innerHTML = `
    <div class="card-image">
      <img src="${article.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="${article.title}">
      ${article.source.name ? `<div class="source-badge">${article.source.name}</div>` : ''}
    </div>
    <div class="card-content">
      <h3 class="card-title">
        <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
      </h3>
      <p class="card-description">
        ${article.description || article.content?.split('[+')[0] || 'No description available.'}
      </p>
      <div class="card-meta">
        <div class="meta-item">
          <i class="far fa-calendar"></i>
          <span>${formattedDate}</span>
        </div>
        <div class="meta-item">
          <i class="far fa-clock"></i>
          <span>${formattedTime}</span>
        </div>
      </div>
      <div class="bookmark-container">
        <button class="bookmark-btn">
          <i class="far fa-bookmark"></i>
        </button>
      </div>
    </div>
  `;
  
//bookmark button
  const bookmarkBtn = card.querySelector('.bookmark-btn');
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

  const isBookmarked = bookmarks.some(b => b.url === article.url);
  if (isBookmarked) {
    bookmarkBtn.querySelector('i').classList.replace('far', 'fas');
  }

  bookmarkBtn.addEventListener('click', () => {
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

    if (bookmarks.some(b => b.url === article.url)) {
      bookmarks = bookmarks.filter(b => b.url !== article.url);
      bookmarkBtn.querySelector('i').classList.replace('fas', 'far');
    } else {
      const minimalArticle = {
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: { name: article.source?.name || '' }
      };
      bookmarks.push(minimalArticle);
      bookmarkBtn.querySelector('i').classList.replace('far', 'fas');
    }

    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  });

  return card;
}

// Update Page Title
function updatePageTitle(category) {
  pageTitle.textContent = category ? `${category.charAt(0).toUpperCase() + category.slice(1)} News` : 'Top Headlines';
}

// Show Loading
function showLoading() {
  newsContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading news...</p>
    </div>
  `;
}

// Show Error
function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  newsContainer.appendChild(errorElement);
}

// Mock Articles
function getMockArticles(category) {
  return [{
    title: 'Sample News Title',
    description: 'This is a fallback sample news article.',
    content: 'This is the full content of the sample article that can be summarized.',
    url: '#',
    urlToImage: '',
    publishedAt: new Date().toISOString(),
    source: { name: 'Mock Source' }
  },
];
}
