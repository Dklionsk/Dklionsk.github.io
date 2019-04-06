"use strict";

const defaultTaxBill = 0;
var taxBill = 0;

var dollarFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

var divsToTotalsAndPercents = {};

var allExpandableItems = [];

var expanded = false;

var showingPercents = false;

function buildTree(container, node, depth) {
    var row = $("<div>", {"id": node.id, "class": "where-it-went-row"});
    container.append(row);

    var nameCol = $("<div>", {"class": "left-col"});
    row.append(nameCol);

    var nameContainer = $("<span>", {"class": "item-name"});
    nameCol.append(nameContainer);

    if (node.children && depth > 0) {
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
        var description = $("<div>", {"class": "description expandable"});
        // var description = $("<div>", {"class": "description"});
        description.html(node.description);
        row.append(description);
    }
    
    if (node.children) {
        if (depth > 0) {
            nameContainer.addClass('expandable-item')
            allExpandableItems.push(nameContainer);
        }
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

    var whatYouPaidInput = $("#what-you-paid-input")
    whatYouPaidInput.val(defaultTaxBill);

    function updateAllValues() {
        for (const [divID, tuple] of Object.entries(divsToTotalsAndPercents)) {
            var [amountCol, amount, percent] = tuple;
            if (showingPercents) {
                amountCol.html((percent * 100).toFixed(2) + "%");
            } else {
                var valueToFormat = taxBill == 0 ? amount : taxBill * percent;
                var formattedAmount = dollarFormatter.format(valueToFormat);
                amountCol.html(formattedAmount);
            }
        }
    }

    function updateTaxBillAndValues() {
        var rawInput = whatYouPaidInput.val();
        
        // Remove all non-numerical characters.
        rawInput = rawInput.replace(/[^0-9.]+/g, "");
        
        // Parse the actual number.
        var inputNumber = rawInput ? parseFloat(rawInput) : 0;
        taxBill = inputNumber;

        // Format the new input string.
        // For some reason, toLocaleString preserves the cursor position, while Intl.NumberFormat does not.
        var formattedInput = inputNumber.toLocaleString("en-US");
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

    function toggleExpandableItem(item, expand = null) {
        var plusButton = item.children().first();
        if (expand != null) {
            if (expand && plusButton.hasClass('minus')) {
                return;
            } else if (!expand && plusButton.hasClass('plus')) {
                return;
            }
        }

        plusButton.toggleClass('plus');
        plusButton.toggleClass('minus');

        var content = item.parent().parent().next();
        content.slideToggle(500);
    }

    $(".expandable-item").click(function() {
        var nameContainer = $(this);
        toggleExpandableItem(nameContainer);
    });

    $(".info").click(function() {
        var infoButton = $(this);
        var description = infoButton.parent().next().next();
        description.slideToggle(500);
    });

    $("#expand-button").click(function() {
        expanded = !expanded;
        $(this).html(expanded ? 'Collapse all' : 'Expand all');
        for (var item of allExpandableItems) {
            toggleExpandableItem(item, expanded);
        }
    });

    $("#percent-button").click(function() {
        showingPercents = !showingPercents;
        $(this).html(showingPercents ? 'Show dollars' : 'Show percents');
        updateAllValues();
    });
});
