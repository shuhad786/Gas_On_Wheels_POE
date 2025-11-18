// List of pages with file paths
const pages = [
  { title: "Home", page: "home", file: "./Home.html", description: "Welcome to our homepage." },
  { title: "About", page: "about", file: "./About.html", description: "Learn more about us." },
  { title: "Products", page: "products", file: "./Products.html", description: "Explore our products." },
  { title: "Services", page: "services", file: "./Services.html", description: "Discover our services." },
  { title: "Contact", page: "contact", file: "./Contact.html", description: "Get in touch with us." },
];

const mainContent = document.getElementById('content');
const searchInput = document.querySelector('.search-input');

const pageContents = {}; // Will hold plain text content of each page

// Fetch and index all pages' text content on load
async function indexPages() {
  for (const p of pages) {
    try {
      const response = await fetch(p.file);
      if (!response.ok) throw new Error(`Failed to load ${p.file}`);
      const html = await response.text();
      // Create a temporary element to extract text content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText || "";
      // Normalize whitespace and convert to lowercase
      const normalizedText = text.replace(/\s+/g, ' ').toLowerCase();
      pageContents[p.page] = normalizedText;
    } catch (error) {
      console.error(error);
      pageContents[p.page] = "";
    }
  }
}

// Search pages by title or indexed content
function searchPages(query) {
  query = query.toLowerCase();
  return pages.filter(p => {
    const content = pageContents[p.page] || "";
    return p.title.toLowerCase().includes(query) || content.includes(query);
  });
}

// Render search results inside #content
function renderResults(results) {
  if (results.length === 0) {
    mainContent.innerHTML = `<p>No results found. Showing home page.</p>`;
    loadContent('home'); // Reload home page if no results
    return;
  }
  mainContent.innerHTML = results.map(page => `
    <div class="search-result" style="margin-bottom: 1rem;">
      <h2><a href="#" data-page="${page.page}">${page.title}</a></h2>
      <p>${page.description}</p>
    </div>
  `).join('');
}

// Load content dynamically into #content div
function loadContent(page) {
  const p = pages.find(pg => pg.page === page.toLowerCase());
  if (!p) {
    mainContent.innerHTML = `<h1>Page Not Found</h1><p>The page "${page}" does not exist.</p>`;
    return;
  }

  fetch(p.file)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load ${p.file}: ${response.statusText}`);
      return response.text();
    })
    .then(html => {
      mainContent.innerHTML = html;
      setupLightbox();  // Attach lightbox listeners to newly loaded images
      setupFormValidationAndAjax(); // Setup form validation & AJAX if form exists
    })
    .catch(error => {
      mainContent.innerHTML = `<p>Error loading page: ${error.message}</p>`;
      console.error(error);
    });
}

// Setup search input event after indexing pages
async function setupSearch() {
  await indexPages();

  searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();

    // Debug logs to verify indexing and query
    console.log("Indexed content for products:", pageContents['products']);
    console.log("Search query:", query);

    if (!query) {
      loadContent('home'); // Load home page when input cleared
      return;
    }
    const results = searchPages(query);

    if (results.length === 1) {
      // If exactly one match, load that page immediately
      loadContent(results[0].page);
    } else {
      // Otherwise, show search results list
      renderResults(results);
    }
  });
}

// Handle clicks on search results to load page dynamically
mainContent.addEventListener('click', function(e) {
  if (e.target.tagName === 'A' && e.target.dataset.page) {
    e.preventDefault();
    const pageName = e.target.dataset.page;
    loadContent(pageName);
    searchInput.value = '';
  }
});

// Lightbox setup function to attach event listeners to images
function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  // Remove previous listeners by cloning nodes (to avoid duplicates)
  document.querySelectorAll('.lightbox-trigger').forEach(img => {
    const newImg = img.cloneNode(true);
    img.parentNode.replaceChild(newImg, img);
  });

  // Attach click listeners to cloned images
  document.querySelectorAll('.lightbox-trigger').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightbox.style.display = 'flex';
    });
  });

  // Close lightbox on close button click
  closeBtn.onclick = () => {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
  };

  // Close lightbox when clicking outside the image
  lightbox.onclick = e => {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
    }
  };

  // Close lightbox on ESC key press
  document.onkeydown = e => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
    }
  };
}

// Setup form validation and AJAX submission for contact form
function setupFormValidationAndAjax() {
  const form = document.querySelector('form');
  if (!form) return;

  const emailInput = form.querySelector('input[name="email"]');
  const nameInput = form.querySelector('input[name="name"]');
  const messageInput = form.querySelector('textarea[name="message"]');

  function showError(input, message) {
    let errorElem = input.nextElementSibling;
    if (!errorElem || !errorElem.classList.contains('error-message')) {
      errorElem = document.createElement('div');
      errorElem.classList.add('error-message');
      errorElem.style.color = 'red';
      errorElem.style.fontSize = '0.9em';
      input.parentNode.insertBefore(errorElem, input.nextSibling);
    }
    errorElem.textContent = message;
    input.classList.add('input-error');
  }

  function clearError(input) {
    let errorElem = input.nextElementSibling;
    if (errorElem && errorElem.classList.contains('error-message')) {
      errorElem.textContent = '';
    }
    input.classList.remove('input-error');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    clearError(emailInput);
    clearError(nameInput);
    clearError(messageInput);

    let valid = true;

    // Validate name
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      showError(nameInput, 'Please enter your name (at least 2 characters).');
      valid = false;
    }

    // Validate email with simple regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailPattern.test(emailInput.value.trim())) {
      showError(emailInput, 'Please enter a valid email address.');
      valid = false;
    }

    // Validate message
    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      showError(messageInput, 'Please enter a message (at least 10 characters).');
      valid = false;
    }

    if (!valid) return;

    // Prepare form data
    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        alert('Thank you for your message! We will get back to you shortly.');
        form.reset();
      } else {
        alert('Oops! Something went wrong. Please try again later.');
      }
    } catch (error) {
      alert('Network error. Please check your connection and try again.');
    }
  });
}
  // Modal functions
function openModal(modalId) {    
  const modal = document.getElementById(modalId);    
  if (modal) {        
    modal.style.display = "block";    
  } else {        
    console.error(`Modal with ID ${modalId} not found.`);    
}}

function closeModal(modalId) {    
  const modal = document.getElementById(modalId);    
  if (modal) {        
    modal.style.display = "none";    
  } else {        
    console.error(`Modal with ID ${modalId} not found.`);    
}}

// Close the modal when clicking outside of it
window.onclick = function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
        closeModal(modal.id);
    }
  });
};
// Initial setup on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  loadContent('home');
});
