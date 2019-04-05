"use strict";

const defaultTaxBill = 0;//10000;
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
    nameCol.append(nameContainer);

    if (node.children) {
        var plusButton = $("<div>", {"class": "plus"});
        nameContainer.append(plusButton);
    }

    var nameSpan = $("<span>");
    nameSpan.html(node.name);
    nameContainer.append(nameSpan);

    if (node.description) {
        var infoButton = $("<div>", {"class": "info"});
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
        // TODO: Hide descriptions again once we're done editing.
        // var description = $("<div>", {"class": "description expandable"});
        var description = $("<div>", {"class": "description"});
        description.html(node.description);
        row.append(description);
    }
    
    if (node.children) {
        nameContainer.addClass('expandable-item')

        // TODO: Decide how much we want to show by default. It's probably depth 2.
        // var content = $("<div>", {"class": "content expandable"});
        var content = $("<div>", {"class": "content"});
        if (depth >= 1) {
            content.addClass("expandable");
        }
        container.append(content);
        for (var child of node.children) {
            buildTree(content, child, depth + 1);
        }
    }
}

function addSumsToInnerNodes(node) {
    var sumOfChildren = 0;
    for (var child of node.children || []) {
        sumOfChildren += addSumsToInnerNodes(child);
    }
    var total = (node.amount || 0) + sumOfChildren;
    node.amount = total;
    return total;
}

function addPercentsToNodes(node, total) {
    if (node.amount != null) {
        node.percent = node.amount / total;   
    }
    for (var child of node.children || []) {
        addPercentsToNodes(child, total)
    }
}

function sortChildrenByAmount(node) {
    if (node.children == null) {
        return;
    }
    node.children.sort(function(a, b) {
        return b.amount - a.amount;
    });
    for (var child of node.children) {
        sortChildrenByAmount(child);
    }
}

$(function() {

    var total = addSumsToInnerNodes(budget);
    addPercentsToNodes(budget, total);

    sortChildrenByAmount(budget);

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

    $(".expandable-item").click(function () {
        var nameContainer = $(this);
        var content = nameContainer.parent().parent().next();
        content.slideToggle(500);

        var plusButton = nameContainer.children().first();
        plusButton.toggleClass('plus');
        plusButton.toggleClass('minus');
    });

    $(".info").click(function () {
        var infoButton = $(this);
        var description = infoButton.parent().next().next();
        description.slideToggle(500);
    });
});
