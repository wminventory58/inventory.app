// Client-side authentication check
if (sessionStorage.getItem('authenticated') !== 'true') {
  window.location.href = 'login.html';
}

// Global array to store inventory items
let inventoryItems = [];

// --- Local Storage Functions ---

/**
 * Saves the current inventory data to local storage.
 */
function saveToLocalStorage() {
  localStorage.setItem("inventoryAppData", JSON.stringify(inventoryItems));
}

/**
 * Loads inventory data from local storage.
 */
function loadFromLocalStorage() {
  const savedData = localStorage.getItem("inventoryAppData");
  if (savedData) {
    inventoryItems = JSON.parse(savedData);
    if (inventoryItems && inventoryItems.length > 0) {
      addItemBtn.disabled = false;
    }
    renderTable(inventoryItems);
  }
}

// --- End Local Storage Functions ---

// DOM elements
const importCsvBtn = document.getElementById("import-csv-btn");
const itemListBody = document.getElementById("item-list-body");
const exportExcelBtn = document.getElementById("export-excel-btn");
const downloadMasterBtn = document.getElementById("downloadMasterBtn");

const addItemBtn = document.getElementById("addItemBtn");
const addItemModal = document.getElementById("addItemModal");
const addItemForm = document.getElementById("addItemForm");
const cancelBtn = document.querySelector(".cancel-btn");
const closeBtn = document.querySelector(".close-button");
const modalErrorMessage = document.getElementById("modal-error-message");

// Search input fields
const filterCategory = document.getElementById("filter-category");
const filterPartNo = document.getElementById("filter-part-no");
const filterDescription = document.getElementById("filter-description");
const filterVendorItemNo = document.getElementById("filter-vendor-item-no");
const filterVendor = document.getElementById("filter-vendor");
const userNameInput = document.getElementById("user-name");

// Create a hidden file input
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".csv";
fileInput.style.display = "none";

/**
 * Creates and displays a notification ribbon with a given message.
 * @param {string} message - The message to display in the ribbon.
 * @param {string} type - The type of notification (e.g., 'error', 'success').
 */
function showNotification(message, type = "error") {
  // Remove any existing notification
  hideNotification();

  const notification = document.createElement("div");
  notification.className = `notification-ribbon ${type}`;
  notification.textContent = message;

  const container = document.querySelector(".app-container");
  container.insertBefore(notification, container.firstChild);
}

/**
 * Hides the notification ribbon if it exists.
 */
function hideNotification() {
  const existingNotification = document.querySelector(".notification-ribbon");
  if (existingNotification) {
    existingNotification.remove();
  }
}

/**
 * Renders the inventory data into the HTML table.
 * @param {Array<Object>} data - The inventory data to render.
 */
function renderTable(data) {
  // Clear the existing table body
  itemListBody.innerHTML = "";

  // Create and append rows for each item
  data.forEach((item) => {
    const row = document.createElement("tr");

    const categoryOptionsHtml = [""]
      .concat(CATEGORY_LIST)
      .map((option) => {
        const selected = item.Category === option ? "selected" : "";
        return `<option value="${option}" ${selected}>${option}</option>`;
      })
      .join("");

    const uomOptionsHtml = [""]
      .concat(UOM_LIST)
      .map((option) => {
        const selected = item.UOM === option ? "selected" : "";
        return `<option value="${option}" ${selected}>${option}</option>`;
      })
      .join("");

    const locationOptionsHtml = [""]
      .concat(LOCATION_LIST)
      .map((option) => {
        const selected = item.Location === option ? "selected" : "";
        return `<option value="${option}" ${selected}>${option}</option>`;
      })
      .join("");

    row.innerHTML = `
      <td>${item["Part #"] || ""}</td>
      <td>${item.Description || ""}</td>
      <td>${item.Category || ""}</td>
      <td class="location-notes-col">
        <select class="location-select" data-id="${item["Part #"]}">
          ${locationOptionsHtml}
        </select>
      </td>
      <td>
        <select class="uom-select" data-id="${item["Part #"]}">
          ${uomOptionsHtml}
        </select>
      </td>
      <td><input type="number" class="quantity-input" data-id="${
        item["Part #"]
      }" value="${item.Quantity || ""}"></td>
      <td class="location-notes-col"><input type="text" class="notes-input" data-id="${
        item["Part #"]
      }" value="${item.Notes || ""}"></td>
     <td><button class="btn btn-primary btn-sm submit-count-btn" data-id="${
       item["Part #"]
     }">Submit</button></td>
    `;
    itemListBody.appendChild(row);
  });
}

/**
 * Filters the inventory items based on the search input fields.
 */
function filterItems() {
  const category = filterCategory.value.toLowerCase();
  const partNo = filterPartNo.value.toLowerCase();
  const description = filterDescription.value.toLowerCase();
  const vendorItemNo = filterVendorItemNo.value.toLowerCase();
  const vendor = filterVendor.value.toLowerCase();

  if (!category && !partNo && !description && !vendorItemNo && !vendor) {
    renderTable([]);
    return;
  }

  const filteredData = inventoryItems.filter((item) => {
    const itemCategory = (item.Category || "").toLowerCase();
    const itemPartNo = (item["Part #"] || "").toLowerCase();
    const itemDescription = (item.Description || "").toLowerCase();
    const itemVendorItemNo = (item["Vendor Item #"] || "").toLowerCase();
    const itemVendor = (item.Vendor || "").toLowerCase();

    return (
      itemCategory.includes(category) &&
      itemPartNo.includes(partNo) &&
      itemDescription.includes(description) &&
      itemVendorItemNo.includes(vendorItemNo) &&
      itemVendor.includes(vendor)
    );
  });

  renderTable(filteredData);
}

// Event listeners for search inputs
filterCategory.addEventListener("change", filterItems);
filterPartNo.addEventListener("keyup", filterItems);
filterDescription.addEventListener("keyup", filterItems);
filterVendorItemNo.addEventListener("keyup", filterItems);
filterVendor.addEventListener("keyup", filterItems);

// Event listener for the "Import CSV" button
importCsvBtn.addEventListener("click", () => {
  // Trigger the hidden file input
  fileInput.click();
});

// Event listener for file selection
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        inventoryItems = results.data.filter(
          (item) => item["Part #"] || item.Description
        ); // Filter out empty rows
        renderTable([]); // Don't render initially
        saveToLocalStorage(); // Save after importing
        addItemBtn.disabled = false; // Enable the "Add New Item" button
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
      },
    });
  }
});

// Append the file input to the body
document.body.appendChild(fileInput);

// Event listener for submit count button
itemListBody.addEventListener("click", (event) => {
  const target = event.target;

  if (target.classList.contains("submit-count-btn")) {
    const partNo = target.dataset.id;
    const row = target.closest("tr");
    const quantityInput = row.querySelector(".quantity-input");
    const uomSelect = row.querySelector(".uom-select");
    const locationSelect = row.querySelector(".location-select");
    const notesInput = row.querySelector(".notes-input");

    // --- Validation Logic ---
    let isValid = true;
    hideNotification(); // Clear previous notifications
    quantityInput.classList.remove("input-error");
    uomSelect.classList.remove("input-error");
    locationSelect.classList.remove("input-error");

    if (!locationSelect.value) {
      locationSelect.classList.add("input-error");
      isValid = false;
    }
    if (!uomSelect.value) {
      uomSelect.classList.add("input-error");
      isValid = false;
    }
    if (!quantityInput.value || parseFloat(quantityInput.value) === 0) {
      quantityInput.classList.add("input-error");
      isValid = false;
    }

    if (!isValid) {
      showNotification(
        "Please fill out all required fields (Location, UOM, and QTY)."
      );
      return; // Stop the submission
    }
    // --- End Validation Logic ---

    const quantity = parseFloat(quantityInput.value);
    const item = inventoryItems.find((item) => item["Part #"] === partNo);

    if (isNaN(quantity) || quantity < 0) {
      quantityInput.classList.add("input-error");
      showNotification("Please enter a valid quantity.");
      return;
    }

    const newEntry = {
      ...item,
      Quantity: quantity,
      UOM: uomSelect.value,
      Location: locationSelect.value,
      Notes: notesInput.value,
      Timestamp: new Date().toISOString(),
    };

    const existingCounts =
      JSON.parse(localStorage.getItem("inventoryCounts")) || [];
    existingCounts.push(newEntry);
    localStorage.setItem("inventoryCounts", JSON.stringify(existingCounts));

    // Visual feedback
    row.classList.add("highlight-success");
    setTimeout(() => {
      row.classList.remove("highlight-success");
    }, 1500);

    // Clear the input fields for the submitted row
    quantityInput.value = "0";
    uomSelect.selectedIndex = 0;
    locationSelect.selectedIndex = 0;
    notesInput.value = "";
  }
});

// --- Real-time Validation for Main Table ---
// Remove .input-error class on user input
itemListBody.addEventListener("input", (event) => {
  const target = event.target;
  if (
    target.classList.contains("quantity-input") ||
    target.classList.contains("notes-input")
  ) {
    if (target.value.trim() !== "") {
      target.classList.remove("input-error");
    }
  }
});

itemListBody.addEventListener("change", (event) => {
  const target = event.target;
  if (
    target.classList.contains("location-select") ||
    target.classList.contains("uom-select")
  ) {
    if (target.value !== "") {
      target.classList.remove("input-error");
    }
  }
});

// Event listener for the "Export to Excel" button
exportExcelBtn.addEventListener("click", () => {
  // 1. Create a new workbook
  const wb = XLSX.utils.book_new();

  // 2. Convert the inventoryItems array to a worksheet
  const ws = XLSX.utils.json_to_sheet(inventoryItems);

  // 3. Append the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");

  // 4. Trigger a download of the generated .xlsx file
  const today = new Date().toISOString().slice(0, 10);
  const userName = localStorage.getItem("userName") || "user";
  const filename = `inventory_count_${userName}_${today}.xlsx`;
  XLSX.writeFile(wb, filename);
});

// Event listener for the "Download Master List" button
downloadMasterBtn.addEventListener("click", () => {
  // Create a temporary link to trigger the download
  const link = document.createElement("a");
  link.href = "master_item_list.csv";
  link.download = "master_item_list.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// --- Initial Load ---
// Load data from local storage when the application starts
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  populateModalDropdowns();
  populateFilterDropdowns();
  loadUserName();
  setDefaultDate();
});

// --- User Name Handling ---

/**
 * Saves the user's name to local storage.
 */
function saveUserName() {
  localStorage.setItem("userName", userNameInput.value);
}

/**
 * Loads the user's name from local storage and populates the input field.
 */
function loadUserName() {
  const savedUserName = localStorage.getItem("userName");
  if (savedUserName) {
    userNameInput.value = savedUserName;
  }
}

// Event listener for the user name input
userNameInput.addEventListener("keyup", saveUserName);

/**
 * Sets the default date for the date input field to the current date.
 */
function setDefaultDate() {
  const dateInput = document.getElementById("count-date");
  if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${year}-${month}-${day}`;
  }
}

// --- Modal Handling ---

// Show modal
addItemBtn.addEventListener("click", () => {
  modalErrorMessage.style.display = "none";
  addItemModal.classList.add("is-visible");
});

// Hide modal
function hideModal() {
 addItemModal.classList.remove("is-visible");
}

cancelBtn.addEventListener("click", hideModal);
closeBtn.addEventListener("click", hideModal);

window.addEventListener("click", (event) => {
 if (event.target === addItemModal) {
   hideModal();
 }
});

// Handle form submission
addItemForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const requiredFields = [
    "description",
    "modal-location",
    "modal-uom",
    "quantity",
  ];
  let isFormValid = true;

  // Clear previous validation states from required fields
  requiredFields.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.classList.remove("is-required");
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        label.classList.remove("is-required");
      }
    }
  });

  // Check for empty required fields
  requiredFields.forEach(id => {
    const input = document.getElementById(id);
    if (input && !input.value.trim()) {
      input.classList.add("is-required");
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        label.classList.add("is-required");
      }
      isFormValid = false;
    }
  });

  if (!isFormValid) {
    modalErrorMessage.textContent = "Please complete all required fields.";
    modalErrorMessage.style.display = "block";
    return; // Stop submission if validation fails
  }

  const newItem = {
    "Part #": document.getElementById("partNo").value,
    Description: document.getElementById("description").value.trim(),
    Category: document.getElementById("modal-category").value,
    "Vendor Item #": document.getElementById("vendorItemNo").value,
    Vendor: document.getElementById("vendor").value,
    Location: document.getElementById("modal-location").value,
    UOM: document.getElementById("modal-uom").value,
    Quantity: document.getElementById("quantity").value,
    Notes: document.getElementById("notes").value,
  };

  // Create a version of the item for the main display list without location or quantity
  const displayItem = { ...newItem };
  delete displayItem.Location;
  delete displayItem.Quantity;

  inventoryItems.push(displayItem);
  saveToLocalStorage();

  // Also create an initial count entry for the new item, with all data
  const newCountEntry = {
    ...newItem, // Copy all properties from the new item
    Timestamp: new Date().toISOString(),
  };
  const existingCounts =
    JSON.parse(localStorage.getItem("inventoryCounts")) || [];
  existingCounts.push(newCountEntry);
  localStorage.setItem("inventoryCounts", JSON.stringify(existingCounts));

  filterItems(); // Re-render the table with the new item

  modalErrorMessage.style.display = "none";
  hideModal();
  
  // Explicitly clear all input fields after processing
  addItemForm.reset();
});

/**
 * Populates the modal's location and UOM dropdowns.
 */
function populateModalDropdowns() {
  const modalLocationSelect = document.getElementById("modal-location");
  const modalUomSelect = document.getElementById("modal-uom");
  const modalCategorySelect = document.getElementById("modal-category");
  // Clear existing options
  modalLocationSelect.innerHTML = "";
  modalUomSelect.innerHTML = "";
  modalCategorySelect.innerHTML = "";

  // Add a blank default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "";
  modalLocationSelect.appendChild(defaultOption.cloneNode(true));
  modalUomSelect.appendChild(defaultOption.cloneNode(true));
  modalCategorySelect.appendChild(defaultOption.cloneNode(true));

  // Populate locations
  LOCATION_LIST.forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    modalLocationSelect.appendChild(option);
  });

  // Populate UOMs
  UOM_LIST.forEach((uom) => {
    const option = document.createElement("option");
    option.value = uom;
    option.textContent = uom;
    modalUomSelect.appendChild(option);
  });

  // Populate categories
  CATEGORY_LIST.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    modalCategorySelect.appendChild(option);
  });
}

/**
 * Populates the filter dropdowns.
 */
function populateFilterDropdowns() {
  const filterCategorySelect = document.getElementById("filter-category");
  filterCategorySelect.innerHTML = "";

  // Add a blank default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "All Categories";
  filterCategorySelect.appendChild(defaultOption.cloneNode(true));

  // Populate categories
  CATEGORY_LIST.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    filterCategorySelect.appendChild(option);
  });
}

// --- Real-time Validation ---
// As a user types into a required field, remove the .is-required class from it.
const fieldsToValidate = [
  "description",
  "modal-location",
  "modal-uom",
  "quantity",
];
fieldsToValidate.forEach((fieldId) => {
  const input = document.getElementById(fieldId);
  if (input) {
    const eventType = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(eventType, () => {
      if (input.value.trim() !== "") {
        input.classList.remove("is-required");
        const label = document.querySelector(`label[for="${fieldId}"]`);
        if (label) {
          label.classList.remove("is-required");
        }
      }
    });
  }
});
