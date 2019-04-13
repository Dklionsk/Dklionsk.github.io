"use strict";

const defaultTaxBill = 0;
var taxBill = 0;

var bigDollarFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumSignificantDigits: 7,
});

var dollarFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
});

var percentFormatter = new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 3,
});

var divsToTotalsAndPercents = {};

var allExpandableItems = [];

var allFilterableItems = [];

var idsToFilterableItems = {};
var idsToExpandableItems = {};

var expanded = false;

var showingPercents = true;

var filterString = "";

function formatValue(value) {
    var formatter = value >= 1000000 ? bigDollarFormatter : dollarFormatter;
    return formatter.format(value);
}

function buildTree(container, node, depth, indexInLevel) {
    var row = $("<div>", {"id": node.id, "class": "budget-row"});
    container.append(row);
    if (depth > 0) {
        allFilterableItems.push(row);
        idsToFilterableItems[node.id] = row;
    }

    row.addClass((indexInLevel + depth) % 2 == 0 ? "row-a" : "row-b");

    var nameCol = $("<div>", {"class": "name-col"});
    row.append(nameCol);

    if (node.amount) {
        var formattedAmount = formatValue(node.amount);
        var amountCol = $("<div>", {"id": node.id + "-amount", "class": "amount-col"});
        amountCol.html(formattedAmount);
        row.append(amountCol);
        divsToTotalsAndPercents[node.id] = [amountCol, node.amount, node.percent];
    }

    if (node.description) {
        var description = $("<div>", {"class": "description expandable"});
        description.html(node.description);
        row.append(description);
    }

    var nameColContents = $("<div>", {"class": "name-col-contents"});
    nameCol.append(nameColContents);

    var expandAndNameContainer = $("<div>", {"class": "expand-name-container"});
    nameColContents.append(expandAndNameContainer);

    var infoButtonContainer = $("<div>", {"class": "info-button-container"});
    nameColContents.append(infoButtonContainer);

    if (depth > 0) {
        var expandButtonContainer = $("<div>", {"class": "expand-button-container"});
        expandAndNameContainer.append(expandButtonContainer);

        var expandButtonClasses = node.children && depth > 0 ? "icon expand" : "icon";
        var expandButton = $("<div>", {"class": expandButtonClasses});
        expandButtonContainer.append(expandButton);
    }

    var nameContainer = $("<div>", {"class": "name-container"});
    expandAndNameContainer.append(nameContainer);
    nameContainer.html(node.name);

    var infoButtonClasses = node.description ? "icon info" : "icon";
    var infoButton = $("<div>", {"class": infoButtonClasses});
    infoButtonContainer.append(infoButton);

    if (node.children) {
        if (depth > 0) {
            expandAndNameContainer.addClass('expandable-item')
            allExpandableItems.push(expandAndNameContainer);
            idsToExpandableItems[node.id] = expandAndNameContainer;
        }
        var content = $("<div>", {"class": "content"});
        if (depth >= 1) {
            content.addClass("expandable");
        }
        container.append(content);

        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            buildTree(content, child, depth + 1, i + (indexInLevel % 2));
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

    var whatYouPaidInput = $("#tax-input")
    whatYouPaidInput.val(defaultTaxBill);

    function updateAllValues() {
        for (const [divID, tuple] of Object.entries(divsToTotalsAndPercents)) {
            var [amountCol, amount, percent] = tuple;
            if (showingPercents && percent != 1.0) {
                amountCol.html(percentFormatter.format(percent * 100) + "%");
            } else {
                var valueToFormat = taxBill == 0 ? amount : taxBill * percent;
                var formattedAmount = formatValue(valueToFormat);
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

    function updatePercentButton() {
        $("#percent-button").html(showingPercents ? 'Show dollars' : 'Show percents');
        updateAllValues();
    }

    whatYouPaidInput.on("change paste keyup keypress", function() {
        if (event.keyCode == 13) {
          event.preventDefault();
          return false;
        }
        if (showingPercents) {
            showingPercents = !showingPercents;
            updatePercentButton();
        }
        updateTaxBillAndValues();
    });

    var budgetContainer = $("#budget-container");
    buildTree(budgetContainer, budget, 0, 0);

    updateTaxBillAndValues();

    function toggleExpandableItem(item, expand = null, animated = true) {
        var plusButton = item.children().first().children().first();
        if (expand != null) {
            if (expand && plusButton.hasClass("collapse")) {
                return;
            } else if (!expand && plusButton.hasClass("expand")) {
                return;
            }
        }

        plusButton.toggleClass("expand");
        plusButton.toggleClass("collapse");

        var content = item.parent().parent().parent().next();
        content.slideToggle(animated ? 500 : 0);
    }

    $(".expandable-item").click(function() {
        var expandAndNameContainer = $(this);
        toggleExpandableItem(expandAndNameContainer);
    });

    $(".info").click(function() {
        var infoButton = $(this);
        var description = infoButton.parent().parent().parent().next().next();
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
        updatePercentButton();
    });

    function filterWithText(node, text) {
        var found = false;
        var foundInChild = false;
        if (node.name.toLowerCase().includes(text)) {
            found = true;
        }
        if (node.children) {
            for (var child of node.children) {
                if (filterWithText(child, text)) {
                    found = true;
                    foundInChild = true;
                }
            }
        }
        var filterItem = idsToFilterableItems[node.id];
        if (filterItem !== undefined) {
            if (found) {
                filterItem.removeClass('search-filtered');
            } else {
                filterItem.addClass('search-filtered');
            }
        }

        var expandableItem = idsToExpandableItems[node.id];
        if (expandableItem !== undefined) {
            toggleExpandableItem(expandableItem, foundInChild, false);
        }

        return found;
    }

    $("#search-box").on("change paste keyup keypress", function() {
        var filterString = $(this).val().trim().toLowerCase();
        if (filterString.length == 0) {
            for (var item of allFilterableItems) {
                item.removeClass('search-filtered');
            }
        } else {
            filterWithText(budget, filterString);
        }
    });
});
