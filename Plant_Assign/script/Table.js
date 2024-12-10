require.config({
    paths: {
        // Define the path for Tabulator (already included in HTML via CDN)
        tabulator: 'https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min',
        tabulatorCss: 'https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min' // Path for Tabulator CSS
    },
    shim: {
        // Make Tabulator available globally to RequireJS
        tabulator: {
            exports: 'Tabulator'
        }
    }
});

define("Plant/script/table", ["tabulator", "css!tabulatorCss"], function (Tabulator, tableToolbar) {

    var whereUsedTable = {
        showTable: function (data) {
            // Create Tabulator table
            var tableDiv = document.createElement('div');
            tableDiv.id = "example-table";
            widget.body.appendChild(tableDiv);

            var table = new Tabulator("#example-table", {
                data: data,
                layout: "fitColumns",
                resizableColumnGuide: true,
                selectableRows: true,
                maxHeight: "400px",
                dataTree: true,
                persistence: {
                    columns: true, //persist column layout
                },
                columnDefaults: {
                    tooltip: true,
                },
                movableColumns: true,
                selectableRowsRangeMode: "click",
                placeholder: "Item is not used in any structure",
                rowHeader: {
                    formatter: "rowSelection", titleFormatter: "rowSelection", titleFormatterParams: {
                        rowRange: "active" //only toggle the values of the active filtered rows
                    }, 
                    headerSort: false
                },
                layout: "fitData",
                columns: [
                    { title: "EIN", field: "partNumber" },
                    { title: "Title", field: "title" },
                    { title: "Description", field: "description", width: 300, resizable: true },
                    { title: "Type", field: "type" },

                ],
            });
            whereUsedTable.tableData = table;
        }
    };
    widget.whereUsedTable = whereUsedTable;
    return whereUsedTable;

});