"use strict";

const defaultTaxBill = 20000;
var taxBill = 0;

var dollarFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

var smallNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

var tinyNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
});

function updateValues(dataSource, valueCells) {
    for (var i = 0; i < dataSource.length; i++) {
        var percent = dataSource[i][1];
        var value = taxBill * percent;
        var valueCell = valueCells[i];
        valueCell.html(dollarFormatter.format(value));
    }
}

function buildTable(dataSource) {
    var table = $("<div>");

    var valueCells = [];
    for (var category of dataSource) {
        var row = $("<div>", {"class": "category-row"});
        table.append(row);

        var categoryName = category[0];
        var col1 = $("<div>", {"class": "wiw-left-col"});
        col1.html(categoryName);
        row.append(col1);

        var col2 = $("<div>", {"class": "wiw-right-col"});
        row.append(col2);
        valueCells.push(col2);

        //var notes = category[2];
    }
    return [table, valueCells];
}

function updateWhatItBought(table, costByItem, references) {
    table.empty();
    references.empty();

    var index = 1;
    var reference = $("<div>", {"id": "ref" + index, "class": "reference"})
    reference.html(index + '. The breakdown here is based on the executive branch\'s proposed budget for 2018. About 2/3 of the budget goes to "mandatory" spending, primarily Social Security and Medicare. Most congressional budget debate focuses on the 1/3 of the budget available for "discretionary" spending. In general, mandatory spending is expected to increase, since the number of people covered by Medicare and receiving Social Security is expected to increase over time. There\'s an ongoing debate over how the government will continue to fund these benefits, since the number of people paying for benefits through payroll taxes is decreasing relative to the number of people receiving benefits. <a href="https://www.whitehouse.gov/sites/whitehouse.gov/files/omb/budget/fy2018/budget.pdf">(source)</a>');
    references.append(reference);
    index++;

    for (var itemInfo of costByItem) {
        var name = itemInfo[0];
        var cost = itemInfo[1];
        var source = itemInfo[2];
        var notes = itemInfo[3];
        var numberPurchased = taxBill / cost;

        var formattedNumber = '';
        if (numberPurchased < 0.1) {
            formattedNumber = tinyNumberFormatter.format(numberPurchased)
        } else if (numberPurchased < 100) {
            formattedNumber = smallNumberFormatter.format(numberPurchased)
        } else {
            formattedNumber += Math.round(numberPurchased);
        }
        var text = formattedNumber + " " + name + '<sup><a class="reference-link" href="#ref' + index + '">[' + index + ']</a></sup>';

        var row = $("<tr>");
        table.append(row);

        var col1 = $("<td>");
        col1.html(text);
        row.append(col1);

        var reference = $("<div>", {"id": "ref" + index, "class": "reference"})
        reference.html(index + '. ' + notes + ' <a href="' + source +'">(source)</a>');
        references.append(reference);

        index++;
    }
}

$(function() {
    var references = $("#references");

    var whereItWentTableContainer = $("#where-it-went-table");
    var tableAndCells = buildTable(combinedPercents);
    var whereItWentTable = tableAndCells[0];
    var whereItWentValueCells = tableAndCells[1];
    whereItWentTableContainer.append(whereItWentTable);

    var whatItBoughtTableContainer = $("#what-it-bought-table");
    var whatItBoughtTable = $("<table>");
    whatItBoughtTableContainer.append(whatItBoughtTable);
    
    function updateAllValues() {
        updateValues(combinedPercents, whereItWentValueCells);
        updateWhatItBought(whatItBoughtTable, costByItem, references);
    }

    var whatYouPaidInput = $("#what-you-paid-input")
    whatYouPaidInput.val(defaultTaxBill);

    function updateTaxBillAndValues() {
        var rawInput = whatYouPaidInput.val();
        
        // Remove all non-numerical characters.
        rawInput = rawInput.replace(/[^0-9.]+/g, "");
        
        // Parse the actual number.
        var inputNumber = rawInput ? parseFloat(rawInput) : 0;
        taxBill = inputNumber;

        // Format the new input string.
        // For some reason, toLocaleString preserves the cursor position, while Intl.NumberFormat does not.
        var formattedInput = inputNumber === 0 ? "" : inputNumber.toLocaleString( "en-US" );
        whatYouPaidInput.val(formattedInput);

        $("#paid-value").html('$' + formattedInput);
        
        updateAllValues();
    }

    whatYouPaidInput.on("change paste keyup keypress", function() {

        if (event.keyCode == 13) {
          event.preventDefault();
          return false;
        }

        updateTaxBillAndValues();
    });

    updateTaxBillAndValues();

    whatYouPaidInput.focus();
});
