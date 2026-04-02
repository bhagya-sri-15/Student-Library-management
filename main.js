// ====================== LIBRARY MANAGEMENT SYSTEM ======================

// Sample initial data
const INITIAL_BOOKS = [
    {
        id: 1,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "978-0-7432-7356-5",
        category: "Fiction",
        year: 1925,
        quantity: 3,
        available: 2,
        description: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream."
    },
    {
        id: 2,
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        isbn: "978-0-553-38016-3",
        category: "Science",
        year: 1988,
        quantity: 2,
        available: 1,
        description: "An exploration of black holes, the big bang, and the nature of time itself by one of the greatest scientists."
    },
    {
        id: 3,
        title: "Clean Code",
        author: "Robert C. Martin",
        isbn: "978-0-13-235088-4",
        category: "Technology",
        year: 2008,
        quantity: 4,
        available: 3,
        description: "A handbook of agile software craftsmanship and best practices for writing clean, maintainable code."
    },
    {
        id: 4,
        title: "Sapiens",
        author: "Yuval Noah Harari",
        isbn: "978-0-06-231609-7",
        category: "History",
        year: 2011,
        quantity: 5,
        available: 4,
        description: "A sweeping history of humankind from the Stone Age to the modern day, exploring key revolutions."
    },
    {
        id: 5,
        title: "Atomic Habits",
        author: "James Clear",
        isbn: "978-0-7352-1129-8",
        category: "Self-Help",
        year: 2018,
        quantity: 3,
        available: 1,
        description: "Transform your habits and discover how tiny changes can lead to remarkable results."
    },
    {
        id: 6,
        title: "Data Science Handbook",
        author: "Jake VanderPlas",
        isbn: "978-1-49199-570-0",
        category: "Educational",
        year: 2016,
        quantity: 2,
        available: 2,
        description: "A comprehensive guide to data manipulation, analysis, and visualization with Python."
    }
];

// ====================== APPLICATION STATE ======================
let books = [];
let borrowedBooks = [];
let studentName = "";
let currentBookId = null;

// ====================== INITIALIZATION ======================
$(document).ready(function() {
    initializeApp();
    setupEventListeners();
    displayBooks();
    loadStudentName();
});

function initializeApp() {
    // Load data from localStorage or use initial data
    const storedBooks = localStorage.getItem('books');
    books = storedBooks ? JSON.parse(storedBooks) : INITIAL_BOOKS;
    
    const storedBorrowed = localStorage.getItem('borrowedBooks');
    borrowedBooks = storedBorrowed ? JSON.parse(storedBorrowed) : [];
    
    saveToStorage();
}

function setupEventListeners() {
    // Tab navigation
    $('[data-tab]').on('click', function() {
        const tab = $(this).data('tab');
        switchTab(tab);
    });

    // Add book form submission
    $('#addBookForm').on('submit', addNewBook);

    // Search and filter
    $('#searchInput').on('keyup', filterBooks);
    $('#filterCategory').on('change', filterBooks);

    // Modal
    $('.modal-close, .modal-close-btn').on('click', closeModal);
    $(window).on('click', function(e) {
        if (e.target.id === 'bookModal') {
            closeModal();
        }
    });

    // Modal action buttons
    $(document).on('click', '#borrowBtn', borrowBook);
    $(document).on('click', '#returnBtn', returnBook);
    $(document).on('click', '#deleteBtn', deleteBook);

    // Student name input
    $('#studentName').on('blur', saveStudentName);
}

// ====================== TAB MANAGEMENT ======================
function switchTab(tabName) {
    // Hide all tabs
    $('.tab-content').removeClass('active');
    
    // Remove active state from buttons
    $('[data-tab]').removeClass('active');
    
    // Show selected tab
    $(`#${tabName}`).addClass('active');
    
    // Mark button as active
    $(`[data-tab="${tabName}"]`).addClass('active');

    // Load appropriate content
    if (tabName === 'dashboard') {
        displayBooks();
    } else if (tabName === 'my-books') {
        displayBorrowedBooks();
    }
}

// ====================== BOOK DISPLAY ======================
function displayBooks(booksToDisplay = books) {
    const container = $('#booksContainer');
    container.empty();

    if (booksToDisplay.length === 0) {
        container.html(`
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">📚</div>
                <p>No books found. Try adjusting your filters.</p>
            </div>
        `);
        return;
    }

    booksToDisplay.forEach(book => {
        const bookCard = createBookCard(book);
        container.append(bookCard);
    });

    // Add click handlers to view buttons
    $('.book-view-btn').on('click', function(e) {
        e.stopPropagation();
        const bookId = $(this).data('book-id');
        openBookModal(bookId);
    });

    // Add quick borrow functionality
    $('.book-borrow-btn').on('click', function(e) {
        e.stopPropagation();
        const bookId = $(this).data('book-id');
        currentBookId = bookId;
        
        if (!studentName || studentName.trim() === '') {
            showError('Please enter your name first!');
            return;
        }
        
        quickBorrowBook(bookId);
    });
}

function createBookCard(book) {
    const availableCount = book.available || 0;
    const isAvailable = availableCount > 0;
    const statusClass = isAvailable ? 'status-available' : 'status-unavailable';
    const statusText = isAvailable ? `✓ Available (${availableCount})` : '✗ Unavailable';

    return $(`
        <div class="book-card" data-book-id="${book.id}">
            <div class="book-cover">📖</div>
            <div class="book-info">
                <h3 class="book-title">${formatText(book.title)}</h3>
                <p class="book-author">by ${formatText(book.author)}</p>
                <span class="book-category">${book.category}</span>
                <p class="book-status ${statusClass}">${statusText}</p>
                <div class="book-footer">
                    <button class="book-view-btn" data-book-id="${book.id}">View Details</button>
                    ${isAvailable ? `<button class="book-borrow-btn" data-book-id="${book.id}">Borrow</button>` : ''}
                </div>
            </div>
        </div>
    `);
}

function displayBorrowedBooks() {
    const container = $('#myBooksContainer');
    container.empty();

    if (borrowedBooks.length === 0) {
        container.html(`
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">📕</div>
                <p>You haven't borrowed any books yet. Visit the Dashboard to borrow books!</p>
            </div>
        `);
        return;
    }

    borrowedBooks.forEach(borrowRecord => {
        const book = getBookById(borrowRecord.bookId);
        if (book) {
            const card = createBorrowedBookCard(book, borrowRecord);
            container.append(card);
        }
    });

    // Add click handlers
    $('.book-view-btn').on('click', function(e) {
        e.stopPropagation();
        const bookId = $(this).data('book-id');
        openBookModal(bookId, true);
    });
}

function createBorrowedBookCard(book, borrowRecord) {
    const borrowDate = new Date(borrowRecord.borrowDate).toLocaleDateString();
    const dueDate = new Date(borrowRecord.dueDate).toLocaleDateString();
    const today = new Date();
    const isOverdue = new Date(borrowRecord.dueDate) < today;

    return $(`
        <div class="book-card" data-book-id="${book.id}">
            <div class="book-cover">📖</div>
            <div class="book-info">
                <h3 class="book-title">${formatText(book.title)}</h3>
                <p class="book-author">by ${formatText(book.author)}</p>
                <span class="book-category">${book.category}</span>
                <p style="font-size: 0.85rem; color: #666;">
                    <strong>Borrowed:</strong> ${borrowDate}<br>
                    <strong>Due:</strong> <span style="color: ${isOverdue ? 'red' : 'green'};">${dueDate}</span>
                </p>
                <div class="book-footer">
                    <button class="book-view-btn" data-book-id="${book.id}">View Details</button>
                </div>
            </div>
        </div>
    `);
}

// ====================== BOOK MODAL ======================
function openBookModal(bookId, isBorrowed = false) {
    const book = getBookById(bookId);
    if (!book) return;

    currentBookId = bookId;

    // Update modal content
    $('#modalTitle').text(book.title);
    $('#modalAuthor').text(book.author);
    $('#modalISBN').text(book.isbn);
    $('#modalCategory').text(book.category);
    $('#modalYear').text(book.year);
    $('#modalAvailable').text(book.available || 'N/A');
    $('#modalDescription').text(book.description || 'No description available.');

    // Update button state
    const borrowBtn = $('#borrowBtn');
    const returnBtn = $('#returnBtn');

    if (isBorrowed) {
        borrowBtn.hide();
        returnBtn.show();
    } else {
        const isAvailable = book.available > 0;
        borrowBtn.toggle(isAvailable).text('Borrow Book');
        returnBtn.hide();
    }

    // Show modal
    $('#bookModal').addClass('active');
}

function closeModal() {
    $('#bookModal').removeClass('active');
    currentBookId = null;
}

// ====================== BORROW/RETURN FUNCTIONALITY ======================
function borrowBook() {
    if (!currentBookId) return;

    const book = getBookById(currentBookId);
    if (!book || book.available <= 0) {
        showError('This book is not available for borrowing.');
        return;
    }

    if (!studentName || studentName.trim() === '') {
        showError('Please enter your name first!');
        return;
    }

    // Check if already borrowed
    const alreadyBorrowed = borrowedBooks.some(
        b => b.bookId === currentBookId && b.studentName === studentName
    );

    if (alreadyBorrowed) {
        showError('You have already borrowed this book!');
        return;
    }

    // Create borrow record
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    borrowedBooks.push({
        bookId: currentBookId,
        studentName: studentName,
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString()
    });

    // Update book availability
    book.available = Math.max(0, book.available - 1);

    // Save and update UI
    saveToStorage();
    displayBooks();
    closeModal();
    showSuccess(`Successfully borrowed "${book.title}"! Due date: ${dueDate.toLocaleDateString()}`);
}

function quickBorrowBook(bookId) {
    const book = getBookById(bookId);
    if (!book || book.available <= 0) {
        showError('This book is not available for borrowing.');
        return;
    }

    if (!studentName || studentName.trim() === '') {
        showError('Please enter your name first!');
        return;
    }

    const alreadyBorrowed = borrowedBooks.some(
        b => b.bookId === bookId && b.studentName === studentName
    );

    if (alreadyBorrowed) {
        showError('You have already borrowed this book!');
        return;
    }

    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    borrowedBooks.push({
        bookId: bookId,
        studentName: studentName,
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString()
    });

    book.available = Math.max(0, book.available - 1);

    saveToStorage();
    displayBooks();
    showSuccess(`Successfully borrowed "${book.title}"!`);
}

function returnBook() {
    if (!currentBookId) return;

    const book = getBookById(currentBookId);
    if (!book) return;

    // Find and remove borrow record
    const index = borrowedBooks.findIndex(
        b => b.bookId === currentBookId && b.studentName === studentName
    );

    if (index > -1) {
        borrowedBooks.splice(index, 1);
        book.available = (book.available || 0) + 1;

        saveToStorage();
        displayBooks();
        displayBorrowedBooks();
        closeModal();
        showSuccess(`Successfully returned "${book.title}"`);
    }
}

function deleteBook() {
    if (!currentBookId) return;

    const book = getBookById(currentBookId);
    if (!book) return;

    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
        books = books.filter(b => b.id !== currentBookId);
        
        // Remove borrowed records
        borrowedBooks = borrowedBooks.filter(b => b.bookId !== currentBookId);

        saveToStorage();
        displayBooks();
        closeModal();
        showSuccess('Book deleted successfully!');
    }
}

// ====================== ADD NEW BOOK ======================
function addNewBook(e) {
    e.preventDefault();

    const newBook = {
        id: Math.max(...books.map(b => b.id), 0) + 1,
        title: $('#bookTitle').val().trim(),
        author: $('#bookAuthor').val().trim(),
        isbn: $('#bookISBN').val().trim(),
        category: $('#bookCategory').val(),
        year: parseInt($('#bookYear').val()),
        quantity: parseInt($('#bookQuantity').val()),
        available: parseInt($('#bookQuantity').val()),
        description: $('#bookDescription').val().trim()
    };

    // Validation
    if (!newBook.title || !newBook.author || !newBook.isbn || !newBook.category) {
        showError('Please fill in all required fields!');
        return;
    }

    books.push(newBook);
    saveToStorage();

    // Reset form
    $('#addBookForm')[0].reset();
    showSuccess(`"${newBook.title}" added successfully!`);
    
    // Switch to dashboard
    switchTab('dashboard');
}

// ====================== SEARCH & FILTER ======================
function filterBooks() {
    const searchTerm = $('#searchInput').val().toLowerCase();
    const category = $('#filterCategory').val();

    const filtered = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                             book.author.toLowerCase().includes(searchTerm) ||
                             book.isbn.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !category || book.category === category;

        return matchesSearch && matchesCategory;
    });

    displayBooks(filtered);
}

// ====================== STUDENT NAME ======================
function saveStudentName() {
    studentName = $('#studentName').val().trim();
    localStorage.setItem('studentName', studentName);
    
    if (studentName) {
        showSuccess(`Welcome, ${studentName}!`);
    }
}

function loadStudentName() {
    const saved = localStorage.getItem('studentName');
    if (saved) {
        studentName = saved;
        $('#studentName').val(studentName);
    }
}

// ====================== UTILITY FUNCTIONS ======================
function getBookById(id) {
    return books.find(book => book.id === id);
}

function saveToStorage() {
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks));
}

function showSuccess(message) {
    $('#messageText').text(message);
    $('#successMessage').addClass('show');
    
    setTimeout(() => {
        $('#successMessage').removeClass('show');
    }, 4000);
}

function showError(message) {
    $('#errorText').text(message);
    $('#errorMessage').addClass('show');
    
    setTimeout(() => {
        $('#errorMessage').removeClass('show');
    }, 4000);
}

function formatText(text) {
    if (!text) return '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
}
