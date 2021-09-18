// Boilerplate code copied from ag-grid documentation
// https://www.ag-grid.com/javascript-grid-infinite-scrolling/


const columnDefs = [
    {
        headerName: "ID", width: 55,
        valueGetter: 'node.id',
        cellRenderer: 'loadingRenderer'
    },
    {
        headerName: "Name", field: "name", width: 100,
        editable: true,
        onCellValueChanged: onCellValueChanged
    },
    { headerName: "Email", field: "email", width: 120 },
    { headerName: "Company", field: "company", width: 120 },
    { headerName: "City", field: "city", width: 90 },
    { headerName: "Country", field: "country", width: 110 },
    { headerName: "Job History", field: "job_history", width: 180 },
];

// TODO: find a better place to put config variables
const blockSize = 20;

const gridOptions = {
    components: {
        loadingRenderer: function (params) {
            if (params.value === undefined) {
                return '<img src="/static/img/loading.gif">'
            } else {
                return params.value;
            }
        }

    },
    enableColResize: true,
    rowBuffer: 0,
    cacheBlockSize: blockSize,
    cacheOverflowSize: 3,
    debug: true,
    rowSelection: 'multiple',
    rowDeselection: true,
    columnDefs: columnDefs,
    rowModelType: 'infinite',
    infiniteInitialRowCount: 1,
};

// Initialise the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    let gridDiv = document.querySelector('#results-grid');
    new agGrid.Grid(gridDiv, gridOptions);
    updateAgGrid();
});

// Update the data source when the inputs change
document.getElementById('search-query').onchange = function () {
    updateAgGrid();
};
document.getElementById('search-field').onchange = function () {
    updateAgGrid();
};

function updateAgGrid() {
    function DataSource() {
        this.getRows = function (params) {
            let query = document.getElementById('search-query').value;
            let field = document.getElementById('search-field').value;
            // Calculate the page offset
            let offset = (params.endRow / blockSize) - 1;

            // construct query string
            query_params = '?' + 'query=' + query + '&offset=' + offset;
            if (field !== 'all') {
                query_params += '&field=' + field;
            }

            // query search API
            var request = new XMLHttpRequest();
            request.open('GET', 'search' + query_params, true);
            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    let responseData = JSON.parse(request.responseText);
                    let rowsThisPage = responseData['results'];

                    // if on or after the last page, set the last row.
                    let lastRow = -1;
                    if (responseData['total'] <= params.endRow) {
                        lastRow = responseData['total'];
                    }

                    // call the success callback
                    params.successCallback(rowsThisPage, lastRow);
                }
            }
            request.send();

        }
    }

    let dataSourceInstance = new DataSource();

    gridOptions.api.setDatasource(dataSourceInstance);
}

function onCellValueChangedobsolete(node) {
    console.log("cellValueChanged");
    console.log(node);
    console.log(node.newValue);
    console.log(node.oldValue);
    console.log(node.data);
    console.log(node.node.rowIndex);

    query_params = '?' + 'rowindex=' + node.node.rowIndex +
        '&oldvalue=' + node.oldValue +
        '&newvalue=' + node.newValue;

    // query search API
    var request = new XMLHttpRequest();
    request.open('GET', 'rowchanged' + query_params, true);
    // request.onreadystatechange = function () {
    //     if (request.readyState == 4 && request.status == 200) {
    //     }
    // }
    request.send();
}

function onCellValueChanged(node) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/rowchanged');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function (e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var jsonobj = JSON.parse(xhr.responseText);
            //handle received JSON here
            return;
        }
        console.log(xhr.responseText);
    };
    json_data = {
        'rowindex': node.node.rowIndex,
        'data': node.data,
        'oldvalue': node.oldValue,
        'newvalue': node.newValue,
    };
    json_str = JSON.stringify(json_data);
    xhr.send(json_str);
}