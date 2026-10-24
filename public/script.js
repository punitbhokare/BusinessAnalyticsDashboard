
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

            const findColumn = name =>
                columns.find(c => c.trim().toLowerCase() === name);

            const salesCol = findColumn("sales");
            const profitCol = findColumn("profit");
            const orderCol = findColumn("order id");
            const categoryCol = findColumn("category");

            if (!salesCol || !profitCol) {
                message.textContent =
                    "CSV must contain Sales and Profit columns.";
                return;
            }

            const rows = data.filter(row =>
                row[salesCol] !== "" &&
                row[profitCol] !== "" &&
                Number.isFinite(Number(row[salesCol])) &&
                Number.isFinite(Number(row[profitCol]))
            );

            if (!rows.length) {
                message.textContent = "No valid sales data found.";
                return;
            }

            const totalSales = rows.reduce(
                (sum, row) => sum + Number(row[salesCol]), 0
            );

            const totalProfit = rows.reduce(
                (sum, row) => sum + Number(row[profitCol]), 0
            );

            const totalOrders = orderCol
                ? new Set(rows.map(row => row[orderCol])).size
                : rows.length;

            const money = value => value.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0
            });

            document.getElementById("sales").textContent =
                money(totalSales);

            document.getElementById("profit").textContent =
                money(totalProfit);

            document.getElementById("orders").textContent =
                totalOrders.toLocaleString("en-US");

            document.getElementById("average").textContent =
                money(totalSales / totalOrders);

            const categories = {};

            if (categoryCol) {
                rows.forEach(row => {
                    const category = row[categoryCol] || "Unknown";
                    categories[category] =
                        (categories[category] || 0) +
                        Number(row[salesCol]);
                });
            }

            Plotly.newPlot("salesChart", [{
                x: ["Total Sales", "Total Profit"],
                y: [totalSales, totalProfit],
                type: "bar",
                marker: { color: ["#2563eb", "#10b981"] }
            }], {
                title: "Sales vs Profit",
                paper_bgcolor: "white",
                plot_bgcolor: "white",
                autosize: true
            }, { responsive: true });

            if (categoryCol) {
                Plotly.newPlot("categoryChart", [{
                    labels: Object.keys(categories),
                    values: Object.values(categories),
                    type: "pie",
                    hole: 0.35
                }], {
                    title: "Sales by Category",
                    paper_bgcolor: "white",
                    autosize: true
                }, { responsive: true });
            } else {
                document.getElementById("categoryChart").innerHTML =
                    "Category column not found in CSV.";
            }

            message.textContent =
                `Success! ${rows.length.toLocaleString()} rows analyzed.`;
        },

        error: function () {
            message.textContent = "Could not read the CSV file.";
        }
    });
}
