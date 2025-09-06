  // UI state management
  showLoading() {
    if (this.elements.loading) {
      this.elements.loading.classList.remove('hidden');
    }
    if (this.elements.results) {
      this.elements.results.innerHTML = '';
    }
    if (this.elements.loadMoreContainer) {
      this.elements.loadMoreContainer.classList.add('hidden');
    }
  }

  hideLoading() {
    if (this.elements.loading) {
      this.elements.loading.classList.add('hidden');
    }
    if (this.elements.loadMoreBtn) {
      this.elements.loadMoreBtn.disabled = false;
      this.elements.loadMoreBtn.textContent = 'Load More Gems';
    }
  }

  showLoadMoreLoading() {
    if (this.elements.loadMoreBtn) {
      this.elements.loadMoreBtn.disabled = true;
      this.elements.loadMoreBtn.textContent = 'Loading...';
    }
  }

  refresh() {
    if (window.app) window.app.discoverGems();
  }

  toggleLoadMore(show) {
    if (this.elements.loadMoreContainer) {
      if (show) {
        this.elements.loadMoreContainer.classList.remove('hidden');
      } else {
        this.elements.loadMoreContainer.classList.add('hidden');
      }
    }
  }

