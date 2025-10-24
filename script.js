// script.js - Production Optimized JavaScript
'use strict';

// Global variables
const state = {
  currentTestimonial: 0,
  carouselInterval: null,
  resizeTimeout: null,
  isMobile: window.innerWidth < 768
};

// DOM Elements cache
const elements = {
  toast: document.getElementById('toast'),
  sidebar: document.getElementById('sidebar'),
  hamburger: document.getElementById('hamburger'),
  overlay: document.getElementById('overlay'),
  toggleBtn: document.querySelector('.toggle-btn'),
  backToTopBtn: document.getElementById('backToTop'),
  yearEl: document.getElementById('year')
};

// Configuration
const config = {
  carouselInterval: 5000,
  resizeDelay: 250,
  scrollThreshold: 300,
  toastDuration: 3000,
  animationThreshold: 0.1,
  skillAnimationThreshold: 0.3
};

/**
 * Toast notification system
 */
class Toast {
  constructor(element) {
    this.element = element;
    this.timeout = null;
  }

  show(message, type = 'success') {
    if (!this.element) return;

    // Clear previous
    this.hide();
    clearTimeout(this.timeout);

    // Reset classes
    this.element.className = 'toast';
    
    // Set content and style
    this.element.textContent = message;
    this.element.classList.add('show', `toast-${type}`);

    // Auto hide
    this.timeout = setTimeout(() => {
      this.hide();
    }, config.toastDuration);

    // Accessibility
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('role', 'status');
  }

  hide() {
    if (!this.element) return;
    this.element.classList.remove('show', 'toast-success', 'toast-error', 'toast-warning');
  }
}

// Initialize toast system
const toast = new Toast(elements.toast);

/**
 * Sidebar management
 */
class SidebarManager {
  constructor() {
    this.sidebar = elements.sidebar;
    this.hamburger = elements.hamburger;
    this.overlay = elements.overlay;
    this.isOpen = false;
    
    this.init();
  }

  init() {
    this.setInitialState();
    this.bindEvents();
  }

  setInitialState() {
    if (state.isMobile) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  bindEvents() {
    // Hamburger menu
    if (this.hamburger) {
      this.hamburger.addEventListener('click', () => this.toggle());
      this.hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    // Overlay
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (state.isMobile) this.close();
      });
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen && state.isMobile) {
        this.close();
      }
    });

    // Resize handling
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  toggle() {
    if (state.isMobile) {
      this.isOpen ? this.close() : this.open();
    } else {
      this.toggleDesktop();
    }
  }

  open() {
    if (!this.sidebar || !this.overlay) return;
    
    this.sidebar.classList.add('sidebar-expanded');
    this.overlay.classList.add('active');
    this.hamburger?.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;

    // Focus management for accessibility
    const firstLink = this.sidebar.querySelector('.nav-link');
    if (firstLink) firstLink.focus();
  }

  close() {
    if (!this.sidebar || !this.overlay) return;
    
    this.sidebar.classList.remove('sidebar-expanded');
    this.overlay.classList.remove('active');
    this.hamburger?.classList.remove('active');
    document.body.style.overflow = '';
    this.isOpen = false;

    // Return focus to hamburger
    this.hamburger?.focus();
  }

  toggleDesktop() {
    if (!this.sidebar) return;
    this.sidebar.classList.toggle('collapsed');
  }

  openSidebar() {
    if (!this.sidebar) return;
    this.sidebar.classList.remove('collapsed');
    if (state.isMobile) {
      this.sidebar.classList.add('sidebar-expanded');
    }
  }

  closeSidebar() {
    if (!this.sidebar) return;
    this.sidebar.classList.add('collapsed');
    this.sidebar.classList.remove('sidebar-expanded');
  }

  handleResize() {
    clearTimeout(state.resizeTimeout);
    state.resizeTimeout = setTimeout(() => {
      state.isMobile = window.innerWidth < 768;
      
      if (state.isMobile && this.isOpen) {
        this.close();
      }
      
      if (!state.isMobile) {
        this.overlay?.classList.remove('active');
        document.body.style.overflow = '';
        this.isOpen = false;
      }
    }, config.resizeDelay);
  }
}

/**
 * Testimonial carousel
 */
class TestimonialCarousel {
  constructor() {
    this.track = document.querySelector('.testimonial-track');
    this.slides = document.querySelectorAll('.testimonial-slide');
    this.prevBtn = document.getElementById('prev');
    this.nextBtn = document.getElementById('next');
    this.dotsContainer = document.querySelector('.carousel-dots');
    this.dots = [];
    
    if (this.slides.length > 1) {
      this.init();
    }
  }

  init() {
    this.createDots();
    this.bindEvents();
    this.startAutoAdvance();
  }

  createDots() {
    if (!this.dotsContainer) return;

    this.slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
      dot.addEventListener('click', () => this.goToSlide(index));
      
      this.dotsContainer.appendChild(dot);
      this.dots.push(dot);
    });

    this.updateDots();
  }

  bindEvents() {
    // Navigation buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    // Keyboard navigation
    if (this.track) {
      this.track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });
    }

    // Pause on hover/focus
    if (this.track) {
      this.track.addEventListener('mouseenter', () => this.stopAutoAdvance());
      this.track.addEventListener('mouseleave', () => this.startAutoAdvance());
      this.track.addEventListener('focusin', () => this.stopAutoAdvance());
      this.track.addEventListener('focusout', () => this.startAutoAdvance());
    }

    // Swipe support for touch devices
    this.addSwipeSupport();
  }

  addSwipeSupport() {
    if (!this.track) return;

    let startX = 0;
    let currentX = 0;

    const handleStart = (e) => {
      startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
      this.stopAutoAdvance();
    };

    const handleMove = (e) => {
      if (!startX) return;
      currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    };

    const handleEnd = () => {
      if (!startX) return;

      const diff = startX - currentX;
      const threshold = 50;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }

      startX = 0;
      currentX = 0;
      this.startAutoAdvance();
    };

    // Mouse events
    this.track.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Touch events
    this.track.addEventListener('touchstart', handleStart);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }

  goToSlide(index) {
    if (index < 0) index = this.slides.length - 1;
    if (index >= this.slides.length) index = 0;

    const slideWidth = this.slides[0].offsetWidth;
    if (this.track) {
      this.track.style.transform = `translateX(-${index * slideWidth}px)`;
    }

    state.currentTestimonial = index;
    this.updateDots();
    
    // Accessibility
    this.slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', i !== index);
      slide.querySelector('.testimonial-content')?.setAttribute('tabindex', i === index ? '0' : '-1');
    });
  }

  next() {
    this.goToSlide(state.currentTestimonial + 1);
  }

  prev() {
    this.goToSlide(state.currentTestimonial - 1);
  }

  updateDots() {
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === state.currentTestimonial);
      dot.setAttribute('aria-current', index === state.currentTestimonial);
    });
  }

  startAutoAdvance() {
    this.stopAutoAdvance();
    state.carouselInterval = setInterval(() => {
      this.next();
    }, config.carouselInterval);
  }

  stopAutoAdvance() {
    if (state.carouselInterval) {
      clearInterval(state.carouselInterval);
      state.carouselInterval = null;
    }
  }
}

/**
 * Image modal system
 */
class ImageModal {
  constructor() {
    this.modal = document.getElementById('imageModal');
    this.modalContent = this.modal?.querySelector('.modal-content');
    this.modalClose = this.modal?.querySelector('.modal-close');
    
    if (this.modal) {
      this.init();
    }
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.open(button);
      });
    });

    // Close events
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.close());
    }

    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('open')) {
        this.close();
      }
    });
  }

  open(button) {
    const imgSrc = button.getAttribute('data-image');
    const imgAlt = button.getAttribute('data-alt') || 'Portfolio Image';

    if (!imgSrc || !this.modalContent) return;

    // Create image with loading state
    this.modalContent.innerHTML = `
      <div class="loading" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
        Loading...
      </div>
    `;

    const img = new Image();
    img.src = imgSrc;
    img.alt = imgAlt;
    img.loading = 'eager';

    img.onload = () => {
      this.modalContent.innerHTML = '';
      this.modalContent.appendChild(img);
    };

    img.onerror = () => {
      this.modalContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--muted);">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
          <p>Failed to load image</p>
        </div>
      `;
    };

    this.modal?.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    this.modalClose?.focus();
  }

  close() {
    this.modal?.classList.remove('open');
    document.body.style.overflow = '';
    
    // Return focus to the button that opened the modal
    const activeElement = document.activeElement;
    if (activeElement?.classList.contains('view-btn')) {
      activeElement.focus();
    }
  }
}

/**
 * Form handling
 */
class ContactForm {
  constructor() {
    this.form = document.getElementById('contactForm');
    if (this.form) {
      this.init();
    }
  }

  init() {
    this.bindEvents();
    this.setupValidation();
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    this.form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  setupValidation() {
    // Add required attributes
    const requiredFields = this.form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      field.setAttribute('aria-required', 'true');
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';

    switch (field.type) {
      case 'email':
        isValid = this.isValidEmail(value);
        message = isValid ? '' : 'Please enter a valid email address';
        break;
      default:
        if (field.required && !value) {
          isValid = false;
          message = 'This field is required';
        }
    }

    this.setFieldValidity(field, isValid, message);
    return isValid;
  }

  setFieldValidity(field, isValid, message) {
    field.setAttribute('aria-invalid', !isValid);
    
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Add error message
    if (!isValid && message) {
      const errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      errorElement.style.cssText = `
        color: var(--error);
        font-size: 0.875rem;
        margin-top: 0.25rem;
      `;
      errorElement.textContent = message;
      errorElement.setAttribute('role', 'alert');
      
      field.parentNode.appendChild(errorElement);
    }

    // Visual feedback
    field.classList.toggle('error', !isValid);
  }

  clearFieldError(field) {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const fields = this.form.querySelectorAll('input, textarea');
    let isFormValid = true;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      toast.show('Please fix the errors in the form', 'error');
      
      // Focus first invalid field
      const firstInvalid = this.form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      
      return;
    }

    // Simulate form submission
    try {
      this.setFormState('loading');
      
      // Simulate API call
      await this.submitForm();
      
      this.form.reset();
      toast.show('Message sent successfully! I will get back to you soon.');
      
    } catch (error) {
      toast.show('Failed to send message. Please try again.', 'error');
      console.error('Form submission error:', error);
    } finally {
      this.setFormState('idle');
    }
  }

  setFormState(state) {
    const submitButton = this.form.querySelector('button[type="submit"]');
    const resetButton = this.form.querySelector('button[type="reset"]');
    
    if (state === 'loading') {
      submitButton.disabled = true;
      resetButton.disabled = true;
      submitButton.classList.add('loading');
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    } else {
      submitButton.disabled = false;
      resetButton.disabled = false;
      submitButton.classList.remove('loading');
      submitButton.innerHTML = '<i class="fa fa-paper-plane"></i> Send Message';
    }
  }

  async submitForm() {
    // Simulate API call delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for demo
        Math.random() > 0.2 ? resolve() : reject(new Error('Network error'));
      }, 1500);
    });
  }
}

/**
 * Animation controllers
 */
class AnimationManager {
  constructor() {
    this.observers = new Map();
    this.init();
  }

  init() {
    this.setupSkillAnimations();
    this.setupScrollAnimations();
  }

  setupSkillAnimations() {
    const skillLevels = document.querySelectorAll('.skill-level');
    if (!skillLevels.length) return;

    const skillObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const targetWidth = entry.target.getAttribute('data-target') || '90%';
          entry.target.style.width = targetWidth;
          skillObserver.unobserve(entry.target);
        }
      });
    }, { 
      threshold: config.skillAnimationThreshold,
      rootMargin: '0px 0px -50px 0px'
    });

    skillLevels.forEach(skill => {
      skill.style.width = '0%';
      skillObserver.observe(skill);
    });
  }

  setupScrollAnimations() {
    const animatedElements = document.querySelectorAll(
      '.content-card, .portfolio-item, .skills-box, .education-entry, .testimonial-content, .competency-card, .experience-entry'
    );

    if (!animatedElements.length) return;

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          animationObserver.unobserve(entry.target);
        }
      });
    }, { 
      threshold: config.animationThreshold,
      rootMargin: '0px 0px -100px 0px'
    });

    animatedElements.forEach(element => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      animationObserver.observe(element);
    });
  }
}

/**
 * Tab management system
 */
class TabManager {
  constructor() {
    this.initPortfolioTabs();
    this.initBrandingTabs();
  }

  initPortfolioTabs() {
    const tabLinks = document.querySelectorAll('.nav-link-portfolio');
    const tabPanes = document.querySelectorAll('.portfolio-category');

    if (!tabLinks.length || !tabPanes.length) return;

    tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.activateTab(link, tabLinks, tabPanes, 'data-category');
      });
    });
  }

  initBrandingTabs() {
    const subnavLinks = document.querySelectorAll('.subnav-link');
    const subcategoryPanes = document.querySelectorAll('.branding-subcategory');

    if (!subnavLinks.length || !subcategoryPanes.length) return;

    subnavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.activateTab(link, subnavLinks, subcategoryPanes, 'data-subcategory');
      });
    });
  }

  activateTab(activeLink, allLinks, allPanes, dataAttribute) {
    // Update links
    allLinks.forEach(tab => tab.classList.remove('active'));
    activeLink.classList.add('active');

    // Update panes
    allPanes.forEach(pane => pane.classList.remove('active'));
    const targetId = activeLink.getAttribute(dataAttribute);
    const activePane = document.getElementById(targetId);
    
    if (activePane) {
      activePane.classList.add('active');
      
      // Accessibility
      activePane.setAttribute('aria-hidden', 'false');
      allPanes.forEach(pane => {
        if (pane !== activePane) {
          pane.setAttribute('aria-hidden', 'true');
        }
      });
    }
  }
}

/**
 * Utility functions
 */
const Utils = {
  // Set current year in footer
  setCurrentYear() {
    if (elements.yearEl) {
      elements.yearEl.textContent = new Date().getFullYear();
    }
  },

  // Set active navigation link
  setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
      }
    });
  },

  // Back to top functionality
  initBackToTop() {
    if (!elements.backToTopBtn) return;

    elements.backToTopBtn.setAttribute('aria-label', 'Back to top');
    
    const scrollHandler = () => {
      const show = window.pageYOffset > config.scrollThreshold;
      elements.backToTopBtn.classList.toggle('show', show);
    };

    const clickHandler = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    elements.backToTopBtn.addEventListener('click', clickHandler);
  },

  // Image optimization
  optimizeImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    images.forEach(img => {
      // Add error handling
      img.addEventListener('error', function() {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YzcyODAiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
        this.alt = 'Image not available';
      });

      // Add loading state
      if (!img.complete) {
        img.style.opacity = '0';
        img.addEventListener('load', function() {
          this.style.opacity = '1';
          this.style.transition = 'opacity 0.3s ease';
        });
      }
    });
  }
};

/**
 * Main application initialization
 */
class PortfolioApp {
  constructor() {
    this.components = {};
    this.init();
  }

  init() {
    try {
      // Initialize utilities
      Utils.setCurrentYear();
      Utils.setActiveNavLink();
      Utils.initBackToTop();
      Utils.optimizeImages();

      // Initialize components
      this.components.sidebar = new SidebarManager();
      this.components.carousel = new TestimonialCarousel();
      this.components.modal = new ImageModal();
      this.components.contactForm = new ContactForm();
      this.components.animations = new AnimationManager();
      this.components.tabs = new TabManager();

      // Performance monitoring
      this.setupPerformanceMonitoring();
      
      console.log('Portfolio app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize portfolio app:', error);
    }
  }

  setupPerformanceMonitoring() {
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
      });
    }

    // Report errors to console
    window.addEventListener('error', (e) => {
      console.error('JavaScript Error:', e.error);
    });
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
  });
} else {
  new PortfolioApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (state.carouselInterval) {
    clearInterval(state.carouselInterval);
  }
  
  if (state.resizeTimeout) {
    clearTimeout(state.resizeTimeout);
  }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PortfolioApp,
    Toast,
    SidebarManager,
    TestimonialCarousel,
    ImageModal,
    ContactForm,
    AnimationManager,
    TabManager,
    Utils
  };
}