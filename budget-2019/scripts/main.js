"use strict";

const defaultTaxBill = 10000;
var taxBill = 0;

var dollarFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

var divsToTotalsAndPercents = {};

function buildTree(container, node, depth) {
    var row = $("<div>", {"id": node.id, "class": "where-it-went-row"});
    container.append(row);

    var nameCol = $("<div>", {"class": "left-col"});
    row.append(nameCol);

    var nameContainer = $("<span>", {"class": "item-name"});
    nameContainer.html(node.name);
    nameCol.append(nameContainer);

    if (node.description) {
        var infoButton = $("<span>", {"class": "info"});
        infoButton.html('+');
        nameCol.append(infoButton);
    }

    if (node.amount) {
        var formattedAmount = dollarFormatter.format(node.amount);
        var amountCol = $("<div>", {"id": node.id + "-amount", "class": "right-col"});
        amountCol.html(formattedAmount);
        row.append(amountCol);
        divsToTotalsAndPercents[node.id] = [amountCol, node.amount, node.percent];
    }

    if (node.description) {
        var description = $("<div>", {"class": "description"});
        description.html(node.description);
        row.append(description);
    }
    
    if (node.children) {
        var content = $("<div>", {"class": "content"});
        container.append(content);
        for (var child of node.children) {
            buildTree(content, child, depth + 1);
        }
    }
}

$(function() {

    function updateAllValues() {
        for (const [divID, tuple] of Object.entries(divsToTotalsAndPercents)) {
            var [amountCol, amount, percent] = tuple;
            var valueToFormat = taxBill == 0 ? amount : taxBill * percent;
            var formattedAmount = dollarFormatter.format(valueToFormat);
            amountCol.html(formattedAmount);
        }
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

    var budgetContainer = $("#where-it-went-table");
    buildTree(budgetContainer, budget, 0);

    updateTaxBillAndValues();

    $(".item-name").click(function () {
        var nameSpan = $(this);
        var content = nameSpan.parent().parent().next();
        content.slideToggle(500, function () {
            //execute this after slideToggle is done
            //change text of header based on visibility of content div
            //header.text(function () {
                //return content.is(":visible") ? "Collapse" : "Expand";
            //});
        });    
    });

    $(".info").click(function () {
        var infoButton = $(this);
        var description = infoButton.parent().next().next();
        description.slideToggle(500);
    });
});
