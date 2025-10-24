document.addEventListener("DOMContentLoaded", () => {
  // Client-side authentication check
  if (sessionStorage.getItem('authenticated') !== 'true') {
    window.location.href = 'login.html';
    return; // Stop further script execution
  }

  const trackingLogBody = document.getElementById("tracking-log-body");
  const exportExcelBtn = document.getElementById("export-excel-btn");

  let inventoryCounts = [];

  /**
   * Loads the inventory count data from local storage.
   */
  function loadInventoryCounts() {
    const savedData = localStorage.getItem("inventoryCounts");
    if (savedData) {
      inventoryCounts = JSON.parse(savedData);
      renderTrackingLog(inventoryCounts);
    }
  }

  /**
   * Renders the tracking log data into the HTML table.
   * @param {Array<Object>} data - The count data to render.
   */
  function renderTrackingLog(data) {
    if (!trackingLogBody) return;

    trackingLogBody.innerHTML = ""; // Clear the table body first

    // Create and append rows for each count entry
    data.forEach((count) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${count.Category || ""}</td>
        <td>${count["Part #"] || ""}</td>
        <td>${count.Description || ""}</td>
        <td>${count.Location || ""}</td>
        <td>${count.UOM || ""}</td>
        <td>${count.Quantity}</td>
        <td>${count.Notes || ""}</td>
        <td>${
          count.Timestamp ? new Date(count.Timestamp).toLocaleString() : ""
        }</td>
        <td>
          <button class="btn-edit" data-timestamp="${
            count.Timestamp
          }">&#9998;</button>
          <button class="btn-delete" data-timestamp="${
            count.Timestamp
          }">&times;</button>
        </td>
      `;
      trackingLogBody.appendChild(row);
    });
  }

  /**
   * Exports the current tracking log to an Excel file.
   */
  function exportTrackingLog() {
    if (inventoryCounts.length === 0) {
      alert("No tracking data to export.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(inventoryCounts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Counts");

    const today = new Date().toISOString().slice(0, 10);
    const userName = localStorage.getItem("userName") || "user";
    const filename = `inventory_counts_log_${userName}_${today}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  // --- Initial Load ---
  loadInventoryCounts();

  // --- Event Listeners ---
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", exportTrackingLog);
  }

  if (trackingLogBody) {
    trackingLogBody.addEventListener("click", (event) => {
      const target = event.target;
      const row = target.closest("tr");
      if (!row) return;

      const timestamp = target.getAttribute("data-timestamp");

      if (target.classList.contains("btn-edit")) {
        // --- Enter Edit Mode ---
        const cells = row.cells; // Use the native cells collection

        // Get current values from the correct indices
        const location = cells[3].textContent;
        const uom = cells[4].textContent;
        const quantity = cells[5].textContent;
        const notes = cells[6].textContent;

        // Create select options
        const uomOptions = UOM_LIST.map(
          (u) =>
            `<option value="${u}" ${u === uom ? "selected" : ""}>${u}</option>`
        ).join("");
        const locationOptions = LOCATION_LIST.map(
          (l) =>
            `<option value="${l}" ${
              l === location ? "selected" : ""
            }>${l}</option>`
        ).join("");

        // Replace cell content with input fields using correct indices
        cells[3].innerHTML = `<select class="edit-location">${locationOptions}</select>`;
        cells[4].innerHTML = `<select class="edit-uom">${uomOptions}</select>`;
        cells[5].innerHTML = `<input type="number" class="edit-quantity" value="${quantity}">`;
        cells[6].innerHTML = `<input type="text" class="edit-notes" value="${notes}">`;

        // --- Actions Cell ---
        const actionsCell = cells[cells.length - 1]; // Always the last cell
        actionsCell.innerHTML = `
          <button class="btn-save" data-timestamp="${timestamp}">&#128190;</button>
          <button class="btn-cancel" data-timestamp="${timestamp}">&#10060;</button>
        `;
      } else if (target.classList.contains("btn-save")) {
        // --- Save Changes ---
        const updatedLocation = row.querySelector(".edit-location").value;
        const updatedUom = row.querySelector(".edit-uom").value;
        const updatedQuantity = row.querySelector(".edit-quantity").value;
        const updatedNotes = row.querySelector(".edit-notes").value;

        // Find the corresponding entry and update it
        const entryIndex = inventoryCounts.findIndex(
          (item) => item.Timestamp == timestamp
        );
        if (entryIndex > -1) {
          inventoryCounts[entryIndex].Location = updatedLocation;
          inventoryCounts[entryIndex].UOM = updatedUom;
          inventoryCounts[entryIndex].Quantity = updatedQuantity;
          inventoryCounts[entryIndex].Notes = updatedNotes;

          // Save to local storage
          localStorage.setItem(
            "inventoryCounts",
            JSON.stringify(inventoryCounts)
          );

          // Re-render the entire table to exit edit mode
          loadInventoryCounts();
        }
      } else if (target.classList.contains("btn-cancel")) {
        // --- Cancel Edit ---
        // Just re-render the table to discard changes
        loadInventoryCounts();
      } else if (target.classList.contains("btn-delete")) {
        // --- Delete Entry ---
        if (confirm("Are you sure you want to delete this entry?")) {
          const updatedCounts = inventoryCounts.filter(
            (item) => item.Timestamp != timestamp
          );
          localStorage.setItem(
            "inventoryCounts",
            JSON.stringify(updatedCounts)
          );
          loadInventoryCounts();
        }
      }
    });
  }

  // Listen for changes in local storage to provide a "real-time" update effect
  window.addEventListener("storage", (event) => {
    if (event.key === "inventoryCounts") {
      loadInventoryCounts();
    }
  });
});
