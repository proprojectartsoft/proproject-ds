
var canvas = document.getElementById('canvas');
var canvascont = $("#canvascont")
var context = canvas.getContext('2d');
var pageElement = document.getElementById('page');

var reachedEdge = false;
var touchStart = null;
var touchDown = false;

var lastTouchTime = 0;
pageElement.addEventListener('touchstart', function (e) {
    touchDown = true;

    if (e.timeStamp - lastTouchTime < 500) {
        lastTouchTime = 0;
        toggleZoom();
    } else {
        lastTouchTime = e.timeStamp;
    }
});

var pointList = [];
$("#canvascont").click(function (e) {
    var x = Math.floor((e.pageX - $("#canvas").offset().left) / 20);
    var y = Math.floor((e.pageY - $("#canvas").offset().top) / 20);
    pointList.push({x: x, y: y});
    rsetTimeout(function () {
        renderMarkers();
    });
});



var pdfFile;
var currPageNumber = 1;


var zoomed = false;
var plusZoom = function () {
    zoomed = true;
    openPage(pdfFile, 1);
}
var minusZoom = function () {
    zoomed = false;
    openPage(pdfFile, 1);
}

var fitScale = 1;
var openPage = function (pdfFile, pageNumber) {
    var scale = zoomed ? fitScale : 1;

    pdfFile.getPage(pageNumber).then(function (page) {
        viewport = page.getViewport(1);

        if (zoomed) {
            var scale = pageElement.clientWidth / viewport.width;
            viewport = page.getViewport(scale);
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvascont.css({'height': viewport.height, 'width': viewport.width})
        var renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        context.fillStyle = "royalblue";
        context.fillRect(200, 200, 60, 60);
        page.render(renderContext);
        setTimeout(function () {
            renderMarkers();
        });

    });
};
var renderMarkers = function () {
    for (var i = 0; i < pointList.length; i++) {
        pointList[i].x = Math.floor((viewport.width - pointList[i].x) / 20);
        pointList[i].y = Math.floor((viewport.height - pointList[i].y) / 20);
    }
}

//https://jsfiddle.net/7hed6uxL/2/
PDFJS.disableStream = true;
PDFJS.getDocument('files/estx.pdf').then(function (pdf) {
    pdfFile = pdf;

    openPage(pdf, currPageNumber, 1);
});
