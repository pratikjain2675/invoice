document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let products = [];
    let invoiceItems = [];
    let currentInvoice = {
        number: 'INV-0001',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        customer: {},
        items: [],
        discount: { type: 'percentage', value: 0 },
        notes: '',
        paymentMethod: 'cash',
        amountPaid: 0
    };

    // DOM Elements
    const productTable = document.getElementById('product-list');
    const productModal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close');
    const addProductBtn = document.getElementById('add-product');
    const saveProductBtn = document.getElementById('save-product');
    const addRowBtn = document.getElementById('add-row');
    const applyDiscountBtn = document.getElementById('apply-discount');
    const newInvoiceBtn = document.getElementById('new-invoice');
    const printInvoiceBtn = document.getElementById('print-invoice');
    const saveInvoiceBtn = document.getElementById('save-invoice');
    const loadInvoiceBtn = document.getElementById('load-invoice');
    const productSearch = document.getElementById('product-search');

    // Initialize the app
    initApp();

    // Functions
    function initApp() {
        // Set current date
        document.getElementById('invoice-date').value = currentInvoice.date;
        document.getElementById('current-date').textContent = new Date().toLocaleDateString();
        
        // Load sample products (in a real app, these would come from a database)
        loadSampleProducts();
        
        // Set up event listeners
        setupEventListeners();
        
        // Calculate totals
        calculateTotals();
    }

    function loadSampleProducts() {
        products = [
            { id: 1, name: 'Website Design', description: 'Custom website design and development', price: 50000, gst: 18 },
            { id: 2, name: 'SEO Package', description: 'Search engine optimization services', price: 25000, gst: 18 },
            { id: 3, name: 'Logo Design', description: 'Custom logo creation', price: 10000, gst: 18 },
            { id: 4, name: 'Hosting', description: 'Web hosting for 1 year', price: 5000, gst: 18 },
            { id: 5, name: 'Consulting', description: 'Business consulting services', price: 15000, gst: 18 }
        ];
    }

    function setupEventListeners() {
        // Modal controls
        addProductBtn.addEventListener('click', () => productModal.style.display = 'block');
        closeModal.addEventListener('click', () => productModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === productModal) productModal.style.display = 'none';
        });

        // Product management
        saveProductBtn.addEventListener('click', saveProduct);
        addRowBtn.addEventListener('click', addEmptyRow);
        productTable.addEventListener('input', handleProductInput);
        productTable.addEventListener('click', handleProductActions);
        productSearch.addEventListener('input', searchProducts);

        // Discount and totals
        applyDiscountBtn.addEventListener('click', applyDiscount);
        document.getElementById('amount-paid').addEventListener('input', calculateTotals);

        // Invoice controls
        newInvoiceBtn.addEventListener('click', createNewInvoice);
        printInvoiceBtn.addEventListener('click', printInvoice);
        saveInvoiceBtn.addEventListener('click', saveInvoice);
        loadInvoiceBtn.addEventListener('click', loadInvoice);

        // Customer and invoice details
        document.getElementById('customer-name').addEventListener('input', updateCustomerDetails);
        document.getElementById('customer-phone').addEventListener('input', updateCustomerDetails);
        document.getElementById('customer-email').addEventListener('input', updateCustomerDetails);
        document.getElementById('customer-address').addEventListener('input', updateCustomerDetails);
        document.getElementById('customer-gst').addEventListener('input', updateCustomerDetails);
        document.getElementById('invoice-date').addEventListener('input', updateInvoiceDetails);
        document.getElementById('due-date').addEventListener('input', updateInvoiceDetails);
        document.getElementById('payment-method').addEventListener('change', updateInvoiceDetails);
        document.getElementById('invoice-notes').addEventListener('input', updateInvoiceDetails);
    }

    function saveProduct() {
        const name = document.getElementById('product-name').value;
        const description = document.getElementById('product-description').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const gst = parseInt(document.getElementById('product-gst').value);

        if (!name || isNaN(price)) {
            alert('Please enter a valid product name and price');
            return;
        }

        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name,
            description,
            price,
            gst
        };

        products.push(newProduct);
        productModal.style.display = 'none';
        clearProductForm();
        addProductToTable(newProduct);
    }

    function clearProductForm() {
        document.getElementById('product-name').value = '';
        document.getElementById('product-description').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-gst').value = '18';
    }

    function addProductToTable(product, quantity = 1, discount = 0) {
        const row = document.createElement('tr');
        row.dataset.productId = product.id;
        
        const total = (product.price * quantity) - discount;
        const gstAmount = total * (product.gst / 100);
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.description}</td>
            <td><input type="number" class="quantity" min="1" value="${quantity}"></td>
            <td>₹${product.price.toFixed(2)}</td>
            <td><input type="number" class="discount" min="0" value="${discount}"></td>
            <td>${product.gst}%</td>
            <td class="item-total">₹${(total + gstAmount).toFixed(2)}</td>
            <td><button class="action-btn delete-item"><i class="fas fa-trash"></i></button></td>
        `;
        
        productTable.appendChild(row);
        calculateTotals();
    }

    function addEmptyRow() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="item-name" placeholder="Item name"></td>
            <td><input type="text" class="item-description" placeholder="Description"></td>
            <td><input type="number" class="quantity" min="1" value="1"></td>
            <td><input type="number" class="price" min="0" step="0.01" placeholder="0.00"></td>
            <td><input type="number" class="discount" min="0" value="0"></td>
            <td>
                <select class="gst-rate">
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18" selected>18%</option>
                    <option value="28">28%</option>
                </select>
            </td>
            <td class="item-total">₹0.00</td>
            <td><button class="action-btn delete-item"><i class="fas fa-trash"></i></button></td>
        `;
        productTable.appendChild(row);
    }

    function handleProductInput(e) {
        if (e.target.classList.contains('quantity') || 
            e.target.classList.contains('price') || 
            e.target.classList.contains('discount') ||
            e.target.classList.contains('gst-rate')) {
            calculateRowTotal(e.target.closest('tr'));
            calculateTotals();
        }
    }

    function handleProductActions(e) {
        if (e.target.classList.contains('delete-item') || e.target.closest('.delete-item')) {
            e.target.closest('tr').remove();
            calculateTotals();
        }
    }

    function calculateRowTotal(row) {
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        let price, gstRate;
        
        if (row.querySelector('.price')) {
            // Custom item row
            price = parseFloat(row.querySelector('.price').value) || 0;
            gstRate = parseInt(row.querySelector('.gst-rate').value) || 0;
        } else {
            // Product row
            const productId = parseInt(row.dataset.productId);
            const product = products.find(p => p.id === productId);
            price = product.price;
            gstRate = product.gst;
        }
        
        const discount = parseFloat(row.querySelector('.discount').value) || 0;
        const subtotal = (price * quantity) - discount;
        const gstAmount = subtotal * (gstRate / 100);
        const total = subtotal + gstAmount;
        
        row.querySelector('.item-total').textContent = `₹${total.toFixed(2)}`;
    }

    function calculateTotals() {
        const rows = productTable.querySelectorAll('tr');
        let subtotal = 0;
        let totalGst = 0;
        
        rows.forEach(row => {
            const totalText = row.querySelector('.item-total').textContent;
            const totalValue = parseFloat(totalText.replace('₹', '')) || 0;
            
            subtotal += totalValue;
            
            // Calculate GST (simplified - in a real app you'd track GST for each item)
            if (row.querySelector('.gst-rate')) {
                const gstRate = parseInt(row.querySelector('.gst-rate').value) || 0;
                const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
                const price = parseFloat(row.querySelector('.price').value) || 0;
                const discount = parseFloat(row.querySelector('.discount').value) || 0;
                const itemSubtotal = (price * quantity) - discount;
                totalGst += itemSubtotal * (gstRate / 100);
            } else if (row.dataset.productId) {
                const productId = parseInt(row.dataset.productId);
                const product = products.find(p => p.id === productId);
                const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
                const discount = parseFloat(row.querySelector('.discount').value) || 0;
                const itemSubtotal = (product.price * quantity) - discount;
                totalGst += itemSubtotal * (product.gst / 100);
            }
        });
        
        // Apply invoice-level discount
        const discountType = document.getElementById('discount-type').value;
        const discountValue = parseFloat(document.getElementById('discount-value').value) || 0;
        let discountAmount = 0;
        
        if (discountType === 'percentage') {
            discountAmount = subtotal * (discountValue / 100);
        } else {
            discountAmount = discountValue;
        }
        
        const grandTotal = subtotal - discountAmount;
        const amountPaid = parseFloat(document.getElementById('amount-paid').value) || 0;
        const balanceDue = grandTotal - amountPaid;
        
        // Update UI
        document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('total-discount').textContent = `₹${discountAmount.toFixed(2)}`;
        document.getElementById('total-gst').textContent = `₹${totalGst.toFixed(2)}`;
        document.getElementById('grand-total').textContent = `₹${grandTotal.toFixed(2)}`;
        document.getElementById('balance-due').textContent = `₹${balanceDue.toFixed(2)}`;
        
        // Update current invoice
        currentInvoice.subtotal = subtotal;
        currentInvoice.discount = { type: discountType, value: discountValue, amount: discountAmount };
        currentInvoice.gst = totalGst;
        currentInvoice.total = grandTotal;
        currentInvoice.amountPaid = amountPaid;
        currentInvoice.balanceDue = balanceDue;
    }

    function applyDiscount() {
        calculateTotals();
    }

    function searchProducts() {
        const searchTerm = productSearch.value.toLowerCase();
        if (searchTerm.length < 2) return;
        
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.description.toLowerCase().includes(searchTerm)
        );
        
        // In a real app, you'd show a dropdown with search results
        console.log('Search results:', filteredProducts);
    }

    function updateCustomerDetails() {
        currentInvoice.customer = {
            name: document.getElementById('customer-name').value,
            phone: document.getElementById('customer-phone').value,
            email: document.getElementById('customer-email').value,
            address: document.getElementById('customer-address').value,
            gstin: document.getElementById('customer-gst').value
        };
    }

    function updateInvoiceDetails() {
        currentInvoice.date = document.getElementById('invoice-date').value;
        currentInvoice.dueDate = document.getElementById('due-date').value;
        currentInvoice.paymentMethod = document.getElementById('payment-method').value;
        currentInvoice.notes = document.getElementById('invoice-notes').value;
    }

    function createNewInvoice() {
        if (confirm('Are you sure you want to create a new invoice? Any unsaved changes will be lost.')) {
            // Generate new invoice number
            const currentNumber = parseInt(currentInvoice.number.split('-')[1]);
            const newNumber = `INV-${(currentNumber + 1).toString().padStart(4, '0')}`;
            
            // Reset form
            document.getElementById('customer-name').value = '';
            document.getElementById('customer-phone').value = '';
            document.getElementById('customer-email').value = '';
            document.getElementById('customer-address').value = '';
            document.getElementById('customer-gst').value = '';
            document.getElementById('invoice-number').value = newNumber;
            document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('due-date').value = '';
            document.getElementById('payment-method').value = 'cash';
            document.getElementById('invoice-notes').value = '';
            document.getElementById('discount-value').value = '0';
            document.getElementById('amount-paid').value = '0';
            
            // Clear product table
            productTable.innerHTML = '';
            
            // Update current invoice
            currentInvoice = {
                number: newNumber,
                date: new Date().toISOString().split('T')[0],
                dueDate: '',
                customer: {},
                items: [],
                discount: { type: 'percentage', value: 0 },
                notes: '',
                paymentMethod: 'cash',
                amountPaid: 0,
                subtotal: 0,
                gst: 0,
                total: 0,
                balanceDue: 0
            };
            
            calculateTotals();
        }
    }

    function printInvoice() {
        // In a real app, you'd generate a printer-friendly version of the invoice
        alert('Print functionality would generate a printer-friendly invoice in a real application');
    }

    function saveInvoice() {
        // Collect all items from the table
        const items = [];
        const rows = productTable.querySelectorAll('tr');
        
        rows.forEach(row => {
            if (row.dataset.productId) {
                const productId = parseInt(row.dataset.productId);
                const product = products.find(p => p.id === productId);
                const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
                const discount = parseFloat(row.querySelector('.discount').value) || 0;
                
                items.push({
                    productId,
                    name: product.name,
                    description: product.description,
                    quantity,
                    price: product.price,
                    discount,
                    gst: product.gst
                });
            } else {
                // Custom items
                const name = row.querySelector('.item-name').value;
                const description = row.querySelector('.item-description').value;
                const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
                const price = parseFloat(row.querySelector('.price').value) || 0;
                const discount = parseFloat(row.querySelector('.discount').value) || 0;
                const gst = parseInt(row.querySelector('.gst-rate').value) || 0;
                
                if (name) {
                    items.push({
                        name,
                        description,
                        quantity,
                        price,
                        discount,
                        gst
                    });
                }
            }
        });
        
        currentInvoice.items = items;
        
        // In a real app, you'd save to a database or localStorage
        localStorage.setItem('lastInvoice', JSON.stringify(currentInvoice));
        alert('Invoice saved successfully! (In a real app, this would save to a database)');
    }

    function loadInvoice() {
        // In a real app, you'd load from a database
        const savedInvoice = localStorage.getItem('lastInvoice');
        
        if (savedInvoice) {
            if (confirm('Load last saved invoice? Current changes will be lost.')) {
                const invoice = JSON.parse(savedInvoice);
                
                // Populate customer details
                document.getElementById('customer-name').value = invoice.customer.name || '';
                document.getElementById('customer-phone').value = invoice.customer.phone || '';
                document.getElementById('customer-email').value = invoice.customer.email || '';
                document.getElementById('customer-address').value = invoice.customer.address || '';
                document.getElementById('customer-gst').value = invoice.customer.gstin || '';
                
                // Populate invoice details
                document.getElementById('invoice-number').value = invoice.number;
                document.getElementById('invoice-date').value = invoice.date;
                document.getElementById('due-date').value = invoice.dueDate || '';
                document.getElementById('payment-method').value = invoice.paymentMethod || 'cash';
                document.getElementById('invoice-notes').value = invoice.notes || '';
                
                // Populate discount
                document.getElementById('discount-type').value = invoice.discount.type || 'percentage';
                document.getElementById('discount-value').value = invoice.discount.value || 0;
                
                // Populate amount paid
                document.getElementById('amount-paid').value = invoice.amountPaid || 0;
                
                // Clear and repopulate product table
                productTable.innerHTML = '';
                
                invoice.items.forEach(item => {
                    if (item.productId) {
                        const product = products.find(p => p.id === item.productId);
                        if (product) {
                            addProductToTable(product, item.quantity, item.discount);
                        }
                    } else {
                        // Add custom item
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><input type="text" class="item-name" value="${item.name}"></td>
                            <td><input type="text" class="item-description" value="${item.description || ''}"></td>
                            <td><input type="number" class="quantity" min="1" value="${item.quantity}"></td>
                            <td><input type="number" class="price" min="0" step="0.01" value="${item.price}"></td>
                            <td><input type="number" class="discount" min="0" value="${item.discount}"></td>
                            <td>
                                <select class="gst-rate">
                                    <option value="0" ${item.gst === 0 ? 'selected' : ''}>0%</option>
                                    <option value="5" ${item.gst === 5 ? 'selected' : ''}>5%</option>
                                    <option value="12" ${item.gst === 12 ? 'selected' : ''}>12%</option>
                                    <option value="18" ${item.gst === 18 ? 'selected' : ''}>18%</option>
                                    <option value="28" ${item.gst === 28 ? 'selected' : ''}>28%</option>
                                </select>
                            </td>
                            <td class="item-total">₹${((item.price * item.quantity - item.discount) * (1 + item.gst / 100)).toFixed(2)}</td>
                            <td><button class="action-btn delete-item"><i class="fas fa-trash"></i></button></td>
                        `;
                        productTable.appendChild(row);
                    }
                });
                
                // Update current invoice
                currentInvoice = invoice;
                calculateTotals();
            }
        } else {
            alert('No saved invoice found');
        }
    }
});