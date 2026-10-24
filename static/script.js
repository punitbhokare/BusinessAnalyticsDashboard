
function uploadFile() {
    const fileInput = document.getElementById("csvFile");
    const message = document.getElementById("message");
    const file = fileInput.files[0];

    if (!file) {
        message.textContent = "Please select a CSV file first.";
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,

        complete: function (results) {
            const data = results.data;
            const columns = results.meta.fields || [];

            const salesColumn = columns.find(c =>
                c.trim().toLowerCase() === "sales"
            );
            const profitColumn = columns.find(c =>
                c.trim().toLowerCase() === "profit"
            );
            const orderColumn = columns.find(c =>
                c.trim().toLowerCase() === "order id"
            );
            const categoryColumn = columns.find(c =>
                c.trim().toLowerCase() === "category"
            );

            if (!salesColumn || !profitColumn) {
                message.textContent =
                    "CSV must contain Sales and Profit columns.";
                return;
            }

            const validRows = data.filter(row =>
                Number.isFinite(Number(row[salesColumn])) &&
                Number.isFinite(Number(row[profitColumn]))
            );

            if (validRows.length === 0) {
                message.textContent = "No valid sales data found.";
                return;
            }

            const totalSales = validRows.reduce(
                (sum, row) => sum + Number(row[salesColumn]), 0
            );

            const totalProfit = validRows.reduce(
                (sum, row) => sum + Number(row[profitColumn]), 0
            );

            const totalOrders = orderColumn
                ? new Set(validRows.map(row => row[orderColumn])).size
                : validRows.length;

            document.getElementById("sales").textContent =
                totalSales.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                });

            document.getElementById("profit").textContent =
                totalProfit.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                });

            document.getElementById("orders").textContent =
                totalOrders.toLocaleString("en-IN");

            document.getElementById("average").textContent =
                (totalSales / totalOrders).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                });

            const categories = {};
            if (categoryColumn) {
                validRows.forEach(row => {
                    const category = row[categoryColumn] || "Unknown";
                    categories[category] =
                        (categories[category] || 0) +
                        Number(row[salesColumn]);
                });
            }

            Plotly.newPlot("salesChart", [{
                x: ["Total Sales", "Total Profit"],
                y: [totalSales, totalProfit],
                type: "bar"
            }], {
                title: "Sales vs Profit",
                autosize: true,
                margin: { t: 50, l: 60, r: 20, b: 50 }
            }, { responsive: true });

            if (categoryColumn) {
                Plotly.newPlot("categoryChart", [{
                    labels: Object.keys(categories),
                    values: Object.values(categories),
                    type: "pie"
                }], {
                    title: "Sales by Category",
                    autosize: true
                }, { responsive: true });
            } else {
                document.getElementById("categoryChart").innerHTML =
                    "Category column not found in CSV.";
            }

            message.textContent =
                `Success! ${validRows.length} rows analyzed.`;
        },

        error: function () {
            message.textContent = "Could not read the CSV file.";
        }
    });
}
