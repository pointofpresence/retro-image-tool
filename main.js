"use strict";

const LINE_WIDTH = 16;
const LINE_HEIGHT = 20;
const WINDOW_COLOR = "#555";

var GlobalWindowIdCounter = 0;
var GlobalWindowZIndexCounter = 0;
var GlobalColors = [];

GlobalColors.push({Red: 0, Green: 0, Blue: 0});
GlobalColors.push({Red: 255, Green: 255, Blue: 255});

var UploadInput = document.getElementById("upload_input");

UploadInput.onchange = function (e) {
    for (var i = 0; i < e.target.files.length; i++) {
        var imageFileReader = new FileReader();

        imageFileReader.onload = (function (File) {
            return (function (FileReaderEvent) {
                if (File.type.indexOf("image/") == 0 && File.type.indexOf("x-ilbm") == -1) {
                    loadStandardImage(FileReaderEvent.target.result, File.name);
                } else {
                    loadOtherImage(FileReaderEvent.target.result, File.name);
                }
            });
        })(e.target.files[i]);

        imageFileReader.readAsDataURL(e.target.files[i]);
    }
};

var Dropzone = document.getElementById("dropzone");

Dropzone.style.width = "100%";
Dropzone.style.height = "100%";

Dropzone.ondragover = function (e) {
    e.preventDefault();
};

Dropzone.ondragleave = function (e) {
    e.preventDefault();
};

Dropzone.ondrop = function (e) {
    e.preventDefault();

    //noinspection JSUnresolvedVariable
    if (e.dataTransfer.types[0] == "Text" || e.dataTransfer.types[0] == "text/plain" || e.dataTransfer.types[0] == "public.utf8-plain-text") {
        var data;

        //noinspection JSUnresolvedVariable
        if (e.dataTransfer.types[0] == "Text") {
            //noinspection JSUnresolvedVariable
            data = e.dataTransfer.getData("Text").split(',');
        } else {
            //noinspection JSUnresolvedVariable
            data = e.dataTransfer.getData("text/plain").split(',');
        }

        document.getElementById(data[2]).style.left = (document.getElementById(data[2]).offsetLeft + e.screenX - parseInt(data[0], 10));
        document.getElementById(data[2]).style.top = (document.getElementById(data[2]).offsetTop + e.screenY - parseInt(data[1], 10));
    }

    //noinspection JSUnresolvedVariable
    for (var i = 0; i < e.dataTransfer.files.length; i++) {
        var imageFileReader = new FileReader();

        //noinspection JSUnresolvedVariable
        imageFileReader.onload = (function (File) {
            return (function (FileReaderEvent) {
                if (File.type.indexOf("image/") == 0 && File.type.indexOf("x-ilbm") == -1) {
                    loadStandardImage(FileReaderEvent.target.result, File.name);
                } else {
                    loadOtherImage(FileReaderEvent.target.result, File.name);
                }
            });
        })(e.dataTransfer.files[i]);

        //noinspection JSUnresolvedVariable
        imageFileReader.readAsDataURL(e.dataTransfer.files[i]);
    }
};

loadStandardImage("sw.png", "sw.png");

// -----------------------------------------------------------------------------

function loadStandardImage(imageSource, fileName) {
    var imageInfos = [];

    imageInfos.Image = document.createElement("img");
    imageInfos.FileName = fileName;

    imageInfos.Image.onload = function () {
        displayImageWindow(imageInfos);
    };

    imageInfos.Image.src = imageSource;
}

function loadOtherImage(imageSource, fileName) {
    var imageInfos = [];

    imageInfos.Image = document.createElement("img");
    imageInfos.FileName = fileName;

    imageInfos.Image.onload = function () {
        displayImageWindow(imageInfos);
    };

    imageInfos.Data = new Uint8Array(base64ToArray(imageSource));

    decodeIff(imageInfos);

    if (imageInfos.Canvas) {
        imageInfos.Image.src = imageInfos.Canvas.toDataURL();
    }
}

function base64ToArray(base64Data) {
    var base64TranslationTable = [
        62, 0, 0, 0, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
        0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        25, 0, 0, 0, 0, 0, 0, 26, 27, 28, 29, 30, 31, 32, 33,
        34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
        48, 49, 50, 51
    ];

    var decodedData = [];

    for (var i = base64Data.lastIndexOf(",") + 1; i < base64Data.length; i += 4) {
        var decodedTriplet =
                (base64TranslationTable[base64Data.charCodeAt(i) - 43] << 18) |
                (base64TranslationTable[base64Data.charCodeAt(i + 1) - 43] << 12) |
                (base64TranslationTable[base64Data.charCodeAt(i + 2) - 43] << 6) |
                base64TranslationTable[base64Data.charCodeAt(i + 3) - 43];

        for (var tripletIndex = 0; tripletIndex < 3; tripletIndex++) {
            if (base64Data[i + tripletIndex] != "=") {
                decodedData.push((decodedTriplet >> (16 - tripletIndex * 8)) & 0xff);
            } else {
                break;
            }
        }
    }

    return decodedData;
}

function decodeIff(imageInfos) {
    var iffInfos = {
        Data:      imageInfos.Data,
        DataIndex: 0,
        Colors:    null,
        Canvas:    null
    };

    parseIff(iffInfos);

    imageInfos.Canvas = iffInfos.Canvas;
    imageInfos.Colors = iffInfos.Colors;
    imageInfos.AspectX = iffInfos.AspectX;
    imageInfos.AspectY = iffInfos.AspectY;
}

function parseIff(iffInfos) {
    var id = String.fromCharCode(iffInfos.Data[iffInfos.DataIndex++]);
    id += String.fromCharCode(iffInfos.Data[iffInfos.DataIndex++]);
    id += String.fromCharCode(iffInfos.Data[iffInfos.DataIndex++]);
    id += String.fromCharCode(iffInfos.Data[iffInfos.DataIndex++]);

    var size = iffInfos.Data[iffInfos.DataIndex++] << 24;
    size += iffInfos.Data[iffInfos.DataIndex++] << 16;
    size += iffInfos.Data[iffInfos.DataIndex++] << 8;
    size += iffInfos.Data[iffInfos.DataIndex++];

    if (iffInfos.DataIndex == 8 && id != "FORM") {
        console.error("Image is not an ILBM file!");
        return;
    }

    var endIndex = iffInfos.DataIndex + size,
        red, green, blue, colorIndex, i, bitPlaneIndex, lineByteIndex;

    while (iffInfos.DataIndex < endIndex) {
        switch (id) {
            case "FORM":
                var type = String.fromCharCode(iffInfos.Data[iffInfos.DataIndex++]);
                type += String.fromCharCode(iffInfos.Data[iffInfos.DataIndex++]);
                type += String.fromCharCode(iffInfos.Data[iffInfos.DataIndex++]);
                type += String.fromCharCode(iffInfos.Data[iffInfos.DataIndex++]);

                if (type != "ILBM") {
                    iffInfos.DataIndex += size;
                    return;
                }

                while (iffInfos.DataIndex < endIndex) {
                    parseIff(iffInfos);
                }

                break;

            case "BMHD":
                iffInfos.Width = iffInfos.Data[iffInfos.DataIndex++] << 8;
                iffInfos.Width += iffInfos.Data[iffInfos.DataIndex++];

                iffInfos.Height = iffInfos.Data[iffInfos.DataIndex++] << 8;
                iffInfos.Height += iffInfos.Data[iffInfos.DataIndex++];

                iffInfos.OffsetX = iffInfos.Data[iffInfos.DataIndex++] << 8;
                iffInfos.OffsetX += iffInfos.Data[iffInfos.DataIndex++];

                iffInfos.OffsetY = iffInfos.Data[iffInfos.DataIndex++] << 8;
                iffInfos.OffsetY += iffInfos.Data[iffInfos.DataIndex++];

                iffInfos.Bitplanes = iffInfos.Data[iffInfos.DataIndex++];
                iffInfos.Masking = iffInfos.Data[iffInfos.DataIndex++];
                iffInfos.Compression = iffInfos.Data[iffInfos.DataIndex++];

                iffInfos.DataIndex++;

                iffInfos.TransparentColor = iffInfos.Data[iffInfos.DataIndex++] << 8;
                iffInfos.TransparentColor += iffInfos.Data[iffInfos.DataIndex++];

                iffInfos.AspectX = iffInfos.Data[iffInfos.DataIndex++];
                iffInfos.AspectY = iffInfos.Data[iffInfos.DataIndex++];

                iffInfos.PageWidth = iffInfos.Data[iffInfos.DataIndex++] << 8;
                iffInfos.PageWidth += iffInfos.Data[iffInfos.DataIndex++];

                iffInfos.PageHeight = iffInfos.Data[iffInfos.DataIndex++] << 8;
                iffInfos.PageHeight += iffInfos.Data[iffInfos.DataIndex++];

                break;

            case "CAMG":
                if (size == 4) {
                    iffInfos.ViewportMode = iffInfos.Data[iffInfos.DataIndex++] << 24;
                    iffInfos.ViewportMode += iffInfos.Data[iffInfos.DataIndex++] << 16;
                    iffInfos.ViewportMode += iffInfos.Data[iffInfos.DataIndex++] << 8;
                    iffInfos.ViewportMode += iffInfos.Data[iffInfos.DataIndex++];
                } else {
                    console.warn("Unknown CAMG chunk size detected!");

                    iffInfos.DataIndex += size;
                }

                break;

            case "CMAP":
                //noinspection JSValidateTypes
                iffInfos.Colors = [];

                var lowerColorBits = 0;

                while (iffInfos.DataIndex < endIndex) {
                    red = iffInfos.Data[iffInfos.DataIndex++];
                    green = iffInfos.Data[iffInfos.DataIndex++];
                    blue = iffInfos.Data[iffInfos.DataIndex++];

                    iffInfos.Colors.push({Red: red, Green: green, Blue: blue});

                    lowerColorBits |= red & 0x0f | green & 0x0f | blue & 0x0f;
                }

                if (lowerColorBits == 0) // Check for a 4096 colors palette.
                {
                    for (colorIndex = 0; colorIndex < iffInfos.Colors.length; colorIndex++) {
                        iffInfos.Colors[colorIndex].Red = Math.floor(iffInfos.Colors[colorIndex].Red * 255.0 / 240.0);
                        iffInfos.Colors[colorIndex].Green = Math.floor(iffInfos.Colors[colorIndex].Green * 255.0 / 240.0);
                        iffInfos.Colors[colorIndex].Blue = Math.floor(iffInfos.Colors[colorIndex].Blue * 255.0 / 240.0);
                    }
                }

                //noinspection JSBitwiseOperatorUsage
                if (iffInfos.DataIndex & 1) { // Avoid odd data index.
                    iffInfos.DataIndex++;
                }

                break;

            case "BODY":
                if (iffInfos.Canvas) {
                    console.info("Found another BODY - skipping...");
                    iffInfos.DataIndex += size;
                    break;
                }

                //noinspection JSBitwiseOperatorUsage
                if (iffInfos.ViewportMode & 0x80) {// EHB image.
                    while (iffInfos.Colors.length < 64) {
                        iffInfos.Colors.push({Red: 0, Green: 0, Blue: 0});
                    }

                    for (i = 0; i < 32; i++) {
                        red = Math.floor(iffInfos.Colors[i].Red / 2.0);
                        green = Math.floor(iffInfos.Colors[i].Green / 2.0);
                        blue = Math.floor(iffInfos.Colors[i].Blue / 2.0);

                        iffInfos.Colors[i + 32].Red = red;
                        iffInfos.Colors[i + 32].Green = green;
                        iffInfos.Colors[i + 32].Blue = blue;
                    }
                }

                //noinspection JSValidateTypes
                iffInfos.Canvas = document.createElement("canvas");

                iffInfos.Canvas.width = iffInfos.Width;
                iffInfos.Canvas.height = iffInfos.Height;

                var context = iffInfos.Canvas.getContext("2d");
                var data = context.getImageData(0, 0, iffInfos.Width, iffInfos.Height);

                var lineByteCount = Math.ceil(iffInfos.Width / 16) * 2;

                var bitPlanes = new Array(iffInfos.Bitplanes);

                for (i = 0; i < iffInfos.Bitplanes; i++)
                    bitPlanes[i] = new Array(lineByteCount);

                for (var y = 0; y < iffInfos.Height; y++) {
                    for (bitPlaneIndex = 0; bitPlaneIndex < iffInfos.Bitplanes; bitPlaneIndex++) {
                        if (iffInfos.Compression == 1) {
                            lineByteIndex = 0;

                            while (lineByteIndex < lineByteCount) {
                                var count = iffInfos.Data[iffInfos.DataIndex++];

                                if (count < 128) {
                                    count++;

                                    while (count--) {
                                        bitPlanes[bitPlaneIndex][lineByteIndex++] = iffInfos.Data[iffInfos.DataIndex++];
                                    }
                                } else {
                                    count = 256 - count + 1;
                                    var byte = iffInfos.Data[iffInfos.DataIndex++];

                                    while (count--) {
                                        bitPlanes[bitPlaneIndex][lineByteIndex++] = byte;
                                    }
                                }
                            }
                        }
                        else {
                            for (lineByteIndex = 0; lineByteIndex < lineByteCount; lineByteIndex++) {
                                bitPlanes[bitPlaneIndex][lineByteIndex] = iffInfos.Data[iffInfos.DataIndex++];
                            }
                        }
                    }

                    for (var x = 0; x < iffInfos.Width; x++) {
                        lineByteIndex = Math.floor(x / 8.0);
                        var byteMask = 0x80 >> (x & 0x7);
                        colorIndex = 0;

                        for (bitPlaneIndex = 0; bitPlaneIndex < iffInfos.Bitplanes; bitPlaneIndex++) {
                            if ((bitPlanes[bitPlaneIndex][lineByteIndex] & byteMask) != 0) {
                                colorIndex += 1 << bitPlaneIndex;
                            }
                        }

                        var pixelIndex = (x + y * iffInfos.Width) * 4;

                        if (colorIndex >= iffInfos.Colors.length) {
                            colorIndex = 0;
                        }

                        data.data[pixelIndex] = iffInfos.Colors[colorIndex].Red;
                        data.data[pixelIndex + 1] = iffInfos.Colors[colorIndex].Green;
                        data.data[pixelIndex + 2] = iffInfos.Colors[colorIndex].Blue;
                        data.data[pixelIndex + 3] = 255;
                    }
                }

                context.putImageData(data, 0, 0);

                break;

            default:
                iffInfos.DataIndex += size;

                //noinspection JSBitwiseOperatorUsage
                if (iffInfos.DataIndex & 1) { // Avoid odd data index.
                    iffInfos.DataIndex++;
                }

                break;
        }
    }
}

function displayImageWindow(imageInfos) {
    imageInfos.Id = GlobalWindowIdCounter++;

    var windowDiv = createImageWindow(imageInfos);

    Dropzone.appendChild(windowDiv);
    processMenuAction(windowDiv.id.substring(windowDiv.id.lastIndexOf("_") + 1));
}

function getColors(canvas) {
    var context = canvas.getContext("2d"),
        data = context.getImageData(0, 0, canvas.width, canvas.height),
        colorCube = new Uint32Array(256 * 256 * 256),
        colors = [];

    for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
            var pixelIndex = (x + y * canvas.width) * 4;

            var red = data.data[pixelIndex],
                green = data.data[pixelIndex + 1],
                blue = data.data[pixelIndex + 2],
                alpha = data.data[pixelIndex + 3];

            if (alpha == 255) {
                if (colorCube[red * 256 * 256 + green * 256 + blue] == 0) {
                    colors.push({Red: red, Green: green, Blue: blue});
                }

                colorCube[red * 256 * 256 + green * 256 + blue]++;
            }
        }
    }

    colors.sort(function (Color1, Color2) {
        return (Color1.Red * 0.21 + Color1.Green * 0.72 + Color1.Blue * 0.07) - (Color2.Red * 0.21 + Color2.Green * 0.72 + Color2.Blue * 0.07)
    });

    return colors;
}

function createColorCube(canvas) {
    var context = canvas.getContext("2d"),
        data = context.getImageData(0, 0, canvas.width, canvas.height),
        totalColorCount = 0,
        colorCube = new Uint32Array(256 * 256 * 256);

    for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
            var pixelIndex = (x + y * canvas.width) * 4;

            var red = data.data[pixelIndex],
                green = data.data[pixelIndex + 1],
                blue = data.data[pixelIndex + 2],
                alpha = data.data[pixelIndex + 3];

            if (alpha == 255) {
                if (colorCube[red * 256 * 256 + green * 256 + blue] == 0)
                    totalColorCount++;

                colorCube[red * 256 * 256 + green * 256 + blue]++;
            }
        }
    }

    return colorCube;
}

function trimColorCube(colorCube, colorCubeInfo) {
    var redMin = 255,
        redMax = 0;

    var greenMin = 255,
        greenMax = 0;

    var blueMin = 255,
        blueMax = 0;

    var redCounts = new Uint32Array(256),
        greenCounts = new Uint32Array(256),
        blueCounts = new Uint32Array(256);

    var totalColorCount = 0;

    var averageRed = 0,
        averageGreen = 0,
        averageBlue = 0;

    for (var red = colorCubeInfo.RedMin; red <= colorCubeInfo.RedMax; red++) {
        for (var green = colorCubeInfo.GreenMin; green <= colorCubeInfo.GreenMax; green++) {
            for (var blue = colorCubeInfo.BlueMin; blue <= colorCubeInfo.BlueMax; blue++) {
                var colorCount = colorCube[red * 256 * 256 + green * 256 + blue];

                if (colorCount != 0) {
                    redCounts[red] += colorCount;
                    greenCounts[green] += colorCount;
                    blueCounts[blue] += colorCount;

                    if (red < redMin) {
                        redMin = red;
                    }

                    if (red > redMax) {
                        redMax = red;
                    }

                    if (green < greenMin) {
                        greenMin = green;
                    }

                    if (green > greenMax) {
                        greenMax = green;
                    }

                    if (blue < blueMin) {
                        blueMin = blue;
                    }

                    if (blue > blueMax) {
                        blueMax = blue;
                    }

                    averageRed += red * colorCount;
                    averageGreen += green * colorCount;
                    averageBlue += blue * colorCount;

                    totalColorCount += colorCount;
                }
            }
        }
    }

    averageRed = Math.round(averageRed / totalColorCount);
    averageGreen = Math.round(averageGreen / totalColorCount);
    averageBlue = Math.round(averageBlue / totalColorCount);

    return {
        RedMin:    redMin, RedMax: redMax, GreenMin: greenMin, GreenMax: greenMax, BlueMin: blueMin, BlueMax: blueMax,
        RedCounts: redCounts, GreenCounts: greenCounts, BlueCounts: blueCounts, Red: averageRed, Green: averageGreen,
        Blue:      averageBlue, ColorCount: totalColorCount
    };
}

function quantizationCountWeight(count) {
    return Math.pow(count, 0.2);
}

function quantizeRecursive(colorCube, colorCubeInfo, palette, recursionDepth, maxRecursionDepth) {
    var redLength = colorCubeInfo.RedMax - colorCubeInfo.RedMin;
    var greenLength = colorCubeInfo.GreenMax - colorCubeInfo.GreenMin;
    var blueLength = colorCubeInfo.BlueMax - colorCubeInfo.BlueMin;

    if (Math.max(redLength, greenLength, blueLength) == 1) {
        return;
    }

    if (recursionDepth == maxRecursionDepth) {
        palette.push({
            Red:   colorCubeInfo.Red,
            Green: colorCubeInfo.Green,
            Blue:  colorCubeInfo.Blue
        });

        return;
    }

    var newColorCubeInfo = [],
        lowIndex, highIndex, lowCount, highCount;

    newColorCubeInfo.RedMin = colorCubeInfo.RedMin;
    newColorCubeInfo.RedMax = colorCubeInfo.RedMax;
    newColorCubeInfo.GreenMin = colorCubeInfo.GreenMin;
    newColorCubeInfo.GreenMax = colorCubeInfo.GreenMax;
    newColorCubeInfo.BlueMin = colorCubeInfo.BlueMin;
    newColorCubeInfo.BlueMax = colorCubeInfo.BlueMax;

    if (redLength >= greenLength && redLength >= blueLength) {
        lowIndex = colorCubeInfo.RedMin;
        highIndex = colorCubeInfo.RedMax;
        lowCount = quantizationCountWeight(colorCubeInfo.RedCounts[lowIndex]);
        highCount = quantizationCountWeight(colorCubeInfo.RedCounts[highIndex]);

        while (lowIndex < highIndex - 1) {
            if (lowCount < highCount) {
                lowCount += quantizationCountWeight(colorCubeInfo.RedCounts[++lowIndex]);
            } else {
                highCount += quantizationCountWeight(colorCubeInfo.RedCounts[--highIndex]);
            }
        }

        colorCubeInfo.RedMax = lowIndex;
        newColorCubeInfo.RedMin = highIndex;
    } else if (greenLength >= redLength && greenLength >= blueLength) {
        lowIndex = colorCubeInfo.GreenMin;
        highIndex = colorCubeInfo.GreenMax;
        lowCount = quantizationCountWeight(colorCubeInfo.GreenCounts[lowIndex]);
        highCount = quantizationCountWeight(colorCubeInfo.GreenCounts[highIndex]);

        while (lowIndex < highIndex - 1) {
            if (lowCount < highCount) {
                lowCount += quantizationCountWeight(colorCubeInfo.GreenCounts[++lowIndex]);
            } else {
                highCount += quantizationCountWeight(colorCubeInfo.GreenCounts[--highIndex]);
            }
        }

        colorCubeInfo.GreenMax = lowIndex;
        newColorCubeInfo.GreenMin = highIndex;
    } else {
        lowIndex = colorCubeInfo.BlueMin;
        highIndex = colorCubeInfo.BlueMax;
        lowCount = quantizationCountWeight(colorCubeInfo.BlueCounts[lowIndex]);
        highCount = quantizationCountWeight(colorCubeInfo.BlueCounts[highIndex]);

        while (lowIndex < highIndex - 1) {
            if (lowCount < highCount) {
                lowCount += quantizationCountWeight(colorCubeInfo.BlueCounts[++lowIndex]);
            } else {
                highCount += quantizationCountWeight(colorCubeInfo.BlueCounts[--highIndex]);
            }
        }

        colorCubeInfo.BlueMax = lowIndex;
        newColorCubeInfo.BlueMin = highIndex;
    }

    quantizeRecursive(colorCube, trimColorCube(colorCube, colorCubeInfo), palette, recursionDepth + 1, maxRecursionDepth);
    quantizeRecursive(colorCube, trimColorCube(colorCube, newColorCubeInfo), palette, recursionDepth + 1, maxRecursionDepth);
}

function remapImage(canvas, palette, floydSteinbergFactor) {
    var floydSteinbergCoefficients = [7 * floydSteinbergFactor, 3 * floydSteinbergFactor, 5 * floydSteinbergFactor, 1 * floydSteinbergFactor],
        // (7, 3, 5, 1) = standard
        context = canvas.getContext("2d"),
        data = context.getImageData(0, 0, canvas.width, canvas.height),
        redDelta, greenDelta, blueDelta;

    for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
            var pixelIndex = (x + y * canvas.width) * 4;

            var red = data.data[pixelIndex];
            var green = data.data[pixelIndex + 1];
            var blue = data.data[pixelIndex + 2];
            var alpha = data.data[pixelIndex + 3];

            if (alpha == 255) {
                // Find the matching color index
                var lastDistance = Number.MAX_VALUE;
                var remappedPaletteIndex = 0;

                for (var paletteIndex = 0; paletteIndex < palette.length; paletteIndex++) {
                    redDelta = palette[paletteIndex].Red - red;
                    greenDelta = palette[paletteIndex].Green - green;
                    blueDelta = palette[paletteIndex].Blue - blue;

                    var distance = redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta;

                    if (distance < lastDistance) {
                        remappedPaletteIndex = paletteIndex;
                        lastDistance = distance;
                    }
                }

                if (floydSteinbergFactor != 0) {
                    redDelta = palette[remappedPaletteIndex].Red - red;
                    greenDelta = palette[remappedPaletteIndex].Green - green;
                    blueDelta = palette[remappedPaletteIndex].Blue - blue;

                    if (x < canvas.width - 1) {
                        data.data[pixelIndex + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4] - redDelta * floydSteinbergCoefficients[0] / 16)));
                        data.data[pixelIndex + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4 + 1] - greenDelta * floydSteinbergCoefficients[0] / 16)));
                        data.data[pixelIndex + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4 + 2] - blueDelta * floydSteinbergCoefficients[0] / 16)));
                    }

                    if (y < canvas.height - 1) {
                        if (x > 0) {
                            data.data[pixelIndex + canvas.width * 4 - 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4] - redDelta * floydSteinbergCoefficients[1] / 16)));
                            data.data[pixelIndex + canvas.width * 4 - 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4 + 1] - greenDelta * floydSteinbergCoefficients[1] / 16)));
                            data.data[pixelIndex + canvas.width * 4 - 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4 + 2] - blueDelta * floydSteinbergCoefficients[1] / 16)));
                        }

                        data.data[pixelIndex + canvas.width * 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4] - redDelta * floydSteinbergCoefficients[2] / 16)));
                        data.data[pixelIndex + canvas.width * 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 1] - greenDelta * floydSteinbergCoefficients[2] / 16)));
                        data.data[pixelIndex + canvas.width * 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 2] - blueDelta * floydSteinbergCoefficients[2] / 16)));

                        if (x < canvas.width - 1) {
                            data.data[pixelIndex + canvas.width * 4 + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4] - redDelta * floydSteinbergCoefficients[3] / 16)));
                            data.data[pixelIndex + canvas.width * 4 + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4 + 1] - greenDelta * floydSteinbergCoefficients[3] / 16)));
                            data.data[pixelIndex + canvas.width * 4 + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4 + 2] - blueDelta * floydSteinbergCoefficients[3] / 16)));
                        }
                    }
                }

                data.data[pixelIndex] = palette[remappedPaletteIndex].Red;
                data.data[pixelIndex + 1] = palette[remappedPaletteIndex].Green;
                data.data[pixelIndex + 2] = palette[remappedPaletteIndex].Blue;
                data.data[pixelIndex + 3] = 255;
            }
        }
    }

    context.putImageData(data, 0, 0);
}

function remapImageLuminance(canvas, colors, ditherPattern) {
    var context = canvas.getContext("2d"),
        data = context.getImageData(0, 0, canvas.width, canvas.height),
        mixedColors = [],
        luminance2, colorIndex, distance,
        redDelta, greenDelta, blueDelta, luminanceDelta;

    if (ditherPattern && ditherPattern[0] == 1 && colors.length <= 64) {
        var colorCount = colors.length;

        for (var index1 = 0; index1 < colorCount; index1++) {
            for (var index2 = index1 + 1; index2 < colorCount; index2++) {
                luminance2 = colors[index2].Red * 0.21 + colors[index2].Green * 0.72 + colors[index2].Blue * 0.07;

                mixedColors.push({
                    Index1: index1, Index2: index2, Red: Math.round((colors[index1].Red + colors[index2].Red) / 2.0),
                    Green:  Math.round((colors[index1].Green + colors[index2].Green) / 2.0),
                    Blue:   Math.round((colors[index1].Blue + colors[index2].Blue) / 2.0)
                });
            }
        }
    }

    for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
            var pixelIndex = (x + y * canvas.width) * 4;

            var red = data.data[pixelIndex];
            var green = data.data[pixelIndex + 1];
            var blue = data.data[pixelIndex + 2];
            var alpha = data.data[pixelIndex + 3];
            var luminance = red * 0.21 + green * 0.72 + blue * 0.07;

            if (alpha == 255) {
                // Find the matching color index
                var lastDistance = Number.MAX_VALUE;
                var remappedColorIndex = 0;

                for (colorIndex = 0; colorIndex < colors.length; colorIndex++) {
                    redDelta = colors[colorIndex].Red - red;
                    greenDelta = colors[colorIndex].Green - green;
                    blueDelta = colors[colorIndex].Blue - blue;

                    luminance2 = colors[colorIndex].Red * 0.21 + colors[colorIndex].Green * 0.72 + colors[colorIndex].Blue * 0.07;
                    luminanceDelta = luminance2 - luminance;

                    distance = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                    if (distance < lastDistance) {
                        remappedColorIndex = colorIndex;
                        lastDistance = distance;
                    }
                }

                if (ditherPattern) {
                    if (ditherPattern[0] == 1) { // Checker pattern
                        for (colorIndex = 0; colorIndex < mixedColors.length; colorIndex++) {
                            redDelta = mixedColors[colorIndex].Red - red;
                            greenDelta = mixedColors[colorIndex].Green - green;
                            blueDelta = mixedColors[colorIndex].Blue - blue;

                            luminance2 = mixedColors[colorIndex].Red * 0.21 + mixedColors[colorIndex].Green * 0.72 + mixedColors[colorIndex].Blue * 0.07;
                            luminanceDelta = luminance2 - luminance;

                            var distance1 = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                            redDelta = colors[mixedColors[colorIndex].Index1].Red - red;
                            greenDelta = colors[mixedColors[colorIndex].Index1].Green - green;
                            blueDelta = colors[mixedColors[colorIndex].Index1].Blue - blue;

                            luminance2 = colors[mixedColors[colorIndex].Index1].Red * 0.21 + colors[mixedColors[colorIndex].Index1].Green * 0.72 + colors[mixedColors[colorIndex].Index1].Blue * 0.07;
                            luminanceDelta = luminance2 - luminance;

                            var distance2 = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                            redDelta = colors[mixedColors[colorIndex].Index2].Red - red;
                            greenDelta = colors[mixedColors[colorIndex].Index2].Green - green;
                            blueDelta = colors[mixedColors[colorIndex].Index2].Blue - blue;

                            luminance2 = colors[mixedColors[colorIndex].Index2].Red * 0.21 + colors[mixedColors[colorIndex].Index2].Green * 0.72 + colors[mixedColors[colorIndex].Index2].Blue * 0.07;
                            luminanceDelta = luminance2 - luminance;

                            var distance3 = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                            distance = (distance1 * 8 + distance2 + distance3) / 10;

                            if (distance < lastDistance) {
                                remappedColorIndex = ((x ^ y) & 1) ? mixedColors[colorIndex].Index1 : mixedColors[colorIndex].Index2;
                                lastDistance = distance;
                            }
                        }
                    } else { // Error diffusion
                        redDelta = colors[remappedColorIndex].Red - red;
                        greenDelta = colors[remappedColorIndex].Green - green;
                        blueDelta = colors[remappedColorIndex].Blue - blue;

                        if (x < canvas.width - 2) {
                            if (ditherPattern[4]) {
                                data.data[pixelIndex + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8] - redDelta * ditherPattern[4])));
                                data.data[pixelIndex + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8 + 1] - greenDelta * ditherPattern[4])));
                                data.data[pixelIndex + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8 + 2] - blueDelta * ditherPattern[4])));
                            }

                            if (y < canvas.height - 1 && ditherPattern[9]) {
                                data.data[pixelIndex + canvas.width * 4 + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8] - redDelta * ditherPattern[9])));
                                data.data[pixelIndex + canvas.width * 4 + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8 + 1] - greenDelta * ditherPattern[9])));
                                data.data[pixelIndex + canvas.width * 4 + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8 + 2] - blueDelta * ditherPattern[9])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[14]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8] - redDelta * ditherPattern[14])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 1] - greenDelta * ditherPattern[14])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 2] - blueDelta * ditherPattern[14])));
                            }
                        }

                        if (x < canvas.width - 1) {
                            if (ditherPattern[3]) {
                                data.data[pixelIndex + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4] - redDelta * ditherPattern[3])));
                                data.data[pixelIndex + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4 + 1] - greenDelta * ditherPattern[3])));
                                data.data[pixelIndex + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4 + 2] - blueDelta * ditherPattern[3])));
                            }

                            if (y < canvas.height - 1 && ditherPattern[8]) {
                                data.data[pixelIndex + canvas.width * 4 + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4] - redDelta * ditherPattern[8])));
                                data.data[pixelIndex + canvas.width * 4 + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4 + 1] - greenDelta * ditherPattern[8])));
                                data.data[pixelIndex + canvas.width * 4 + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4 + 2] - blueDelta * ditherPattern[8])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[13]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4] - redDelta * ditherPattern[13])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 1] - greenDelta * ditherPattern[13])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 2] - blueDelta * ditherPattern[13])));
                            }
                        }

                        if (y < canvas.height - 1 && ditherPattern[7]) {
                            data.data[pixelIndex + canvas.width * 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4] - redDelta * ditherPattern[7])));
                            data.data[pixelIndex + canvas.width * 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 1] - greenDelta * ditherPattern[7])));
                            data.data[pixelIndex + canvas.width * 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 2] - blueDelta * ditherPattern[7])));
                        }

                        if (y < canvas.height - 2 && ditherPattern[12]) {
                            data.data[pixelIndex + canvas.width * 2 * 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4] - redDelta * ditherPattern[12])));
                            data.data[pixelIndex + canvas.width * 2 * 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 1] - greenDelta * ditherPattern[12])));
                            data.data[pixelIndex + canvas.width * 2 * 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 2] - blueDelta * ditherPattern[12])));
                        }

                        if (x > 0) {
                            if (y < canvas.height - 1 && ditherPattern[6]) {
                                data.data[pixelIndex + canvas.width * 4 - 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4] - redDelta * ditherPattern[6])));
                                data.data[pixelIndex + canvas.width * 4 - 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4 + 1] - greenDelta * ditherPattern[6])));
                                data.data[pixelIndex + canvas.width * 4 - 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4 + 2] - blueDelta * ditherPattern[6])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[11]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4] - redDelta * ditherPattern[11])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 1] - greenDelta * ditherPattern[11])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 2] - blueDelta * ditherPattern[11])));
                            }
                        }

                        if (x > 1) {
                            if (y < canvas.height - 1 && ditherPattern[5]) {
                                data.data[pixelIndex + canvas.width * 4 - 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8] - redDelta * ditherPattern[5])));
                                data.data[pixelIndex + canvas.width * 4 - 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8 + 1] - greenDelta * ditherPattern[5])));
                                data.data[pixelIndex + canvas.width * 4 - 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8 + 2] - blueDelta * ditherPattern[5])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[10]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8] - redDelta * ditherPattern[10])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 1] - greenDelta * ditherPattern[10])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 2] - blueDelta * ditherPattern[10])));
                            }
                        }
                    }
                }

                data.data[pixelIndex] = colors[remappedColorIndex].Red;
                data.data[pixelIndex + 1] = colors[remappedColorIndex].Green;
                data.data[pixelIndex + 2] = colors[remappedColorIndex].Blue;
                data.data[pixelIndex + 3] = 255;
            }
        }
    }

    context.putImageData(data, 0, 0);
}

function remapZxSpectrumImageLuminance1(canvas, colors, ditherPattern) {
    var context = canvas.getContext("2d"),
        data = context.getImageData(0, 0, canvas.width, canvas.height),
        canvasList = [];

    // Create a valid colors list
    for (var index1 = 0; index1 < 8 - 1; index1++) {
        for (var index2 = index1 + 1; index2 < 8; index2++) {
            // First color block entry
            var newCanvas = document.createElement("canvas");

            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;

            newCanvas.getContext("2d").drawImage(canvas, 0, 0);

            remapImageLuminance(newCanvas, [
                {
                    Red: colors[index1].Red, Green: colors[index1].Green, Blue: colors[index1].Blue
                }, {
                    Red: colors[index2].Red, Green: colors[index2].Green, Blue: colors[index2].Blue
                }
            ], ditherPattern);

            canvasList.push({
                Canvas: newCanvas, Colors: [
                    {
                        Red: colors[index1].Red, Green: colors[index1].Green, Blue: colors[index1].Blue
                    }, {Red: colors[index2].Red, Green: colors[index2].Green, Blue: colors[index2].Blue}
                ]
            });

            // Second color block entry
            newCanvas = document.createElement("canvas");

            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;

            newCanvas.getContext("2d").drawImage(canvas, 0, 0);

            remapImageLuminance(newCanvas, [
                {
                    Red: colors[index1 + 8].Red, Green: colors[index1 + 8].Green, Blue: colors[index1 + 8].Blue
                }, {
                    Red: colors[index2 + 8].Red, Green: colors[index2 + 8].Green, Blue: colors[index2 + 8].Blue
                }
            ], ditherPattern);

            canvasList.push({
                Canvas: newCanvas, Colors: [
                    {
                        Red: colors[index1 + 8].Red, Green: colors[index1 + 8].Green, Blue: colors[index1 + 8].Blue
                    }, {Red: colors[index2 + 8].Red, Green: colors[index2 + 8].Green, Blue: colors[index2 + 8].Blue}
                ]
            });
        }
    }

    // Create colors matrix
    for (var y = 0; y < Math.ceil(canvas.height / 8); y++) {
        for (var x = 0; x < Math.ceil(canvas.width / 8); x++) {
            var bestColorsListIndex = 0;
            var lastDistance = Number.MAX_VALUE;

            for (var colorsListIndex = 0; colorsListIndex < canvasList.length; colorsListIndex++) {
                var totalDistance = 0;

                for (var y2 = 0; y2 < 8; y2++) {
                    for (var x2 = 0; x2 < 8; x2++) {
                        var pixelIndex = (x * 8 + x2 + (y * 8 + y2) * canvas.width) * 4;

                        var red = data.data[pixelIndex],
                            green = data.data[pixelIndex + 1],
                            blue = data.data[pixelIndex + 2],
                            luminance = red * 0.21 + green * 0.72 + blue * 0.07;

                        // First color
                        var redDelta = canvasList[colorsListIndex].Colors[0].Red - red,
                            greenDelta = canvasList[colorsListIndex].Colors[0].Green - green,
                            blueDelta = canvasList[colorsListIndex].Colors[0].Blue - blue;

                        var luminance2 = canvasList[colorsListIndex].Colors[0].Red * 0.21
                            + canvasList[colorsListIndex].Colors[0].Green * 0.72
                            + canvasList[colorsListIndex].Colors[0].Blue * 0.07;

                        var luminanceDelta = luminance2 - luminance;

                        var distance = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                        // Second color
                        redDelta = canvasList[colorsListIndex].Colors[1].Red - red;
                        greenDelta = canvasList[colorsListIndex].Colors[1].Green - green;
                        blueDelta = canvasList[colorsListIndex].Colors[1].Blue - blue;

                        luminance2 = canvasList[colorsListIndex].Colors[1].Red * 0.21 + canvasList[colorsListIndex].Colors[1].Green * 0.72 + canvasList[colorsListIndex].Colors[1].Blue * 0.07;
                        luminanceDelta = luminance2 - luminance;

                        var distance2 = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                        totalDistance += Math.min(distance, distance2);
                    }
                }

                if (totalDistance < lastDistance) {
                    bestColorsListIndex = colorsListIndex;
                    lastDistance = totalDistance;
                }
            }

            canvas.getContext("2d").drawImage(canvasList[bestColorsListIndex].Canvas, x * 8, y * 8, 8, 8, x * 8, y * 8, 8, 8);
        }
    }
}

function remapLineColorsImageLuminance(canvas, lineColors, ditherPattern) {
    var context = canvas.getContext("2d"),
        data = context.getImageData(0, 0, canvas.width, canvas.height),
        luminance2, colorIndex, distance,
        redDelta, greenDelta, blueDelta, luminanceDelta;

    for (var y = 0; y < canvas.height; y++) {
        var colors = lineColors[y];

        var mixedColors = [];

        if (ditherPattern && ditherPattern[0] == 1 && colors.length <= 64) {
            var colorCount = colors.length;

            for (var index1 = 0; index1 < colorCount; index1++) {
                for (var index2 = index1 + 1; index2 < colorCount; index2++) {
                    luminance2 = colors[index2].Red * 0.21 + colors[index2].Green * 0.72 + colors[index2].Blue * 0.07;

                    mixedColors.push({
                        Index1: index1, Index2: index2,
                        Red:    Math.round((colors[index1].Red + colors[index2].Red) / 2.0),
                        Green:  Math.round((colors[index1].Green + colors[index2].Green) / 2.0),
                        Blue:   Math.round((colors[index1].Blue + colors[index2].Blue) / 2.0)
                    });
                }
            }
        }

        for (var x = 0; x < canvas.width; x++) {
            var pixelIndex = (x + y * canvas.width) * 4;

            var red = data.data[pixelIndex];
            var green = data.data[pixelIndex + 1];
            var blue = data.data[pixelIndex + 2];
            var alpha = data.data[pixelIndex + 3];
            var luminance = red * 0.21 + green * 0.72 + blue * 0.07;

            if (alpha == 255) {
                // Find the matching color index
                var lastDistance = Number.MAX_VALUE;
                var remappedColorIndex = 0;

                for (colorIndex = 0; colorIndex < colors.length; colorIndex++) {
                    redDelta = colors[colorIndex].Red - red;
                    greenDelta = colors[colorIndex].Green - green;
                    blueDelta = colors[colorIndex].Blue - blue;

                    luminance2 = colors[colorIndex].Red * 0.21 + colors[colorIndex].Green * 0.72 + colors[colorIndex].Blue * 0.07;
                    luminanceDelta = luminance2 - luminance;

                    distance = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                    if (distance < lastDistance) {
                        remappedColorIndex = colorIndex;
                        lastDistance = distance;
                    }
                }

                if (ditherPattern) {
                    if (ditherPattern[0] == 1) { // Checker pattern
                        for (colorIndex = 0; colorIndex < mixedColors.length; colorIndex++) {
                            redDelta = mixedColors[colorIndex].Red - red;
                            greenDelta = mixedColors[colorIndex].Green - green;
                            blueDelta = mixedColors[colorIndex].Blue - blue;

                            luminance2 = mixedColors[colorIndex].Red * 0.21 + mixedColors[colorIndex].Green * 0.72 + mixedColors[colorIndex].Blue * 0.07;
                            luminanceDelta = luminance2 - luminance;

                            var distance1 = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                            redDelta = colors[mixedColors[colorIndex].Index1].Red - red;
                            greenDelta = colors[mixedColors[colorIndex].Index1].Green - green;
                            blueDelta = colors[mixedColors[colorIndex].Index1].Blue - blue;

                            luminance2 = colors[mixedColors[colorIndex].Index1].Red * 0.21 + colors[mixedColors[colorIndex].Index1].Green * 0.72 + colors[mixedColors[colorIndex].Index1].Blue * 0.07;
                            luminanceDelta = luminance2 - luminance;

                            var distance2 = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                            redDelta = colors[mixedColors[colorIndex].Index2].Red - red;
                            greenDelta = colors[mixedColors[colorIndex].Index2].Green - green;
                            blueDelta = colors[mixedColors[colorIndex].Index2].Blue - blue;

                            luminance2 = colors[mixedColors[colorIndex].Index2].Red * 0.21 + colors[mixedColors[colorIndex].Index2].Green * 0.72 + colors[mixedColors[colorIndex].Index2].Blue * 0.07;
                            luminanceDelta = luminance2 - luminance;

                            var distance3 = (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta) * 0.5 + luminanceDelta * luminanceDelta;

                            distance = (distance1 * 8 + distance2 + distance3) / 10;

                            if (distance < lastDistance) {
                                remappedColorIndex = ((x ^ y) & 1) ? mixedColors[colorIndex].Index1 : mixedColors[colorIndex].Index2;
                                lastDistance = distance;
                            }
                        }
                    } else { // Error diffusion
                        redDelta = colors[remappedColorIndex].Red - red;
                        greenDelta = colors[remappedColorIndex].Green - green;
                        blueDelta = colors[remappedColorIndex].Blue - blue;

                        if (x < canvas.width - 2) {
                            if (ditherPattern[4]) {
                                data.data[pixelIndex + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8] - redDelta * ditherPattern[4])));
                                data.data[pixelIndex + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8 + 1] - greenDelta * ditherPattern[4])));
                                data.data[pixelIndex + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8 + 2] - blueDelta * ditherPattern[4])));
                            }

                            if (y < canvas.height - 1 && ditherPattern[9]) {
                                data.data[pixelIndex + canvas.width * 4 + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8] - redDelta * ditherPattern[9])));
                                data.data[pixelIndex + canvas.width * 4 + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8 + 1] - greenDelta * ditherPattern[9])));
                                data.data[pixelIndex + canvas.width * 4 + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8 + 2] - blueDelta * ditherPattern[9])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[14]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8] - redDelta * ditherPattern[14])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 1] - greenDelta * ditherPattern[14])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 2] - blueDelta * ditherPattern[14])));
                            }
                        }

                        if (x < canvas.width - 1) {
                            if (ditherPattern[3]) {
                                data.data[pixelIndex + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4] - redDelta * ditherPattern[3])));
                                data.data[pixelIndex + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4 + 1] - greenDelta * ditherPattern[3])));
                                data.data[pixelIndex + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4 + 2] - blueDelta * ditherPattern[3])));
                            }

                            if (y < canvas.height - 1 && ditherPattern[8]) {
                                data.data[pixelIndex + canvas.width * 4 + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4] - redDelta * ditherPattern[8])));
                                data.data[pixelIndex + canvas.width * 4 + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4 + 1] - greenDelta * ditherPattern[8])));
                                data.data[pixelIndex + canvas.width * 4 + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4 + 2] - blueDelta * ditherPattern[8])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[13]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4] - redDelta * ditherPattern[13])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 1] - greenDelta * ditherPattern[13])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 2] - blueDelta * ditherPattern[13])));
                            }
                        }

                        if (y < canvas.height - 1 && ditherPattern[7]) {
                            data.data[pixelIndex + canvas.width * 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4] - redDelta * ditherPattern[7])));
                            data.data[pixelIndex + canvas.width * 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 1] - greenDelta * ditherPattern[7])));
                            data.data[pixelIndex + canvas.width * 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 2] - blueDelta * ditherPattern[7])));
                        }

                        if (y < canvas.height - 2 && ditherPattern[12]) {
                            data.data[pixelIndex + canvas.width * 2 * 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4] - redDelta * ditherPattern[12])));
                            data.data[pixelIndex + canvas.width * 2 * 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 1] - greenDelta * ditherPattern[12])));
                            data.data[pixelIndex + canvas.width * 2 * 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 2] - blueDelta * ditherPattern[12])));
                        }

                        if (x > 0) {
                            if (y < canvas.height - 1 && ditherPattern[6]) {
                                data.data[pixelIndex + canvas.width * 4 - 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4] - redDelta * ditherPattern[6])));
                                data.data[pixelIndex + canvas.width * 4 - 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4 + 1] - greenDelta * ditherPattern[6])));
                                data.data[pixelIndex + canvas.width * 4 - 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4 + 2] - blueDelta * ditherPattern[6])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[11]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4] - redDelta * ditherPattern[11])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 1] - greenDelta * ditherPattern[11])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 2] - blueDelta * ditherPattern[11])));
                            }
                        }

                        if (x > 1) {
                            if (y < canvas.height - 1 && ditherPattern[5]) {
                                data.data[pixelIndex + canvas.width * 4 - 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8] - redDelta * ditherPattern[5])));
                                data.data[pixelIndex + canvas.width * 4 - 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8 + 1] - greenDelta * ditherPattern[5])));
                                data.data[pixelIndex + canvas.width * 4 - 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8 + 2] - blueDelta * ditherPattern[5])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[10]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8] - redDelta * ditherPattern[10])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 1] - greenDelta * ditherPattern[10])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 2] - blueDelta * ditherPattern[10])));
                            }
                        }
                    }
                }

                data.data[pixelIndex] = colors[remappedColorIndex].Red;
                data.data[pixelIndex + 1] = colors[remappedColorIndex].Green;
                data.data[pixelIndex + 2] = colors[remappedColorIndex].Blue;
                data.data[pixelIndex + 3] = 255;
            }
        }
    }

    context.putImageData(data, 0, 0);
}

function remapFullPaletteImageLuminance(canvas, bitsPerColor, ditherPattern) {
    var context = canvas.getContext("2d"),
        data = context.getImageData(0, 0, canvas.width, canvas.height),
        shadesPerColor = 1 << bitsPerColor;

    for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
            var pixelIndex = (x + y * canvas.width) * 4;

            var red = data.data[pixelIndex],
                green = data.data[pixelIndex + 1],
                blue = data.data[pixelIndex + 2],
                alpha = data.data[pixelIndex + 3];

            if (alpha == 255) {
                if (ditherPattern) {
                    if (ditherPattern[0] == 1) { // Checker pattern
                        //
                    } else { // Error diffusion
                        var matchingRed = Math.floor(Math.floor(red * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));
                        var matchingGreen = Math.floor(Math.floor(green * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));
                        var matchingBlue = Math.floor(Math.floor(blue * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));

                        var redDelta = matchingRed - red;
                        var greenDelta = matchingGreen - green;
                        var blueDelta = matchingBlue - blue;

                        if (x < canvas.width - 2) {
                            if (ditherPattern[4]) {
                                data.data[pixelIndex + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8] - redDelta * ditherPattern[4])));
                                data.data[pixelIndex + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8 + 1] - greenDelta * ditherPattern[4])));
                                data.data[pixelIndex + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 8 + 2] - blueDelta * ditherPattern[4])));
                            }

                            if (y < canvas.height - 1 && ditherPattern[9]) {
                                data.data[pixelIndex + canvas.width * 4 + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8] - redDelta * ditherPattern[9])));
                                data.data[pixelIndex + canvas.width * 4 + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8 + 1] - greenDelta * ditherPattern[9])));
                                data.data[pixelIndex + canvas.width * 4 + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 8 + 2] - blueDelta * ditherPattern[9])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[14]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8] - redDelta * ditherPattern[14])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 1] - greenDelta * ditherPattern[14])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 8 + 2] - blueDelta * ditherPattern[14])));
                            }
                        }

                        if (x < canvas.width - 1) {
                            if (ditherPattern[3]) {
                                data.data[pixelIndex + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4] - redDelta * ditherPattern[3])));
                                data.data[pixelIndex + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4 + 1] - greenDelta * ditherPattern[3])));
                                data.data[pixelIndex + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + 4 + 2] - blueDelta * ditherPattern[3])));
                            }

                            if (y < canvas.height - 1 && ditherPattern[8]) {
                                data.data[pixelIndex + canvas.width * 4 + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4] - redDelta * ditherPattern[8])));
                                data.data[pixelIndex + canvas.width * 4 + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4 + 1] - greenDelta * ditherPattern[8])));
                                data.data[pixelIndex + canvas.width * 4 + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 4 + 2] - blueDelta * ditherPattern[8])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[13]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4] - redDelta * ditherPattern[13])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 1] - greenDelta * ditherPattern[13])));
                                data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 4 + 2] - blueDelta * ditherPattern[13])));
                            }
                        }

                        if (y < canvas.height - 1 && ditherPattern[7]) {
                            data.data[pixelIndex + canvas.width * 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4] - redDelta * ditherPattern[7])));
                            data.data[pixelIndex + canvas.width * 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 1] - greenDelta * ditherPattern[7])));
                            data.data[pixelIndex + canvas.width * 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 + 2] - blueDelta * ditherPattern[7])));
                        }

                        if (y < canvas.height - 2 && ditherPattern[12]) {
                            data.data[pixelIndex + canvas.width * 2 * 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4] - redDelta * ditherPattern[12])));
                            data.data[pixelIndex + canvas.width * 2 * 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 1] - greenDelta * ditherPattern[12])));
                            data.data[pixelIndex + canvas.width * 2 * 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 + 2] - blueDelta * ditherPattern[12])));
                        }

                        if (x > 0) {
                            if (y < canvas.height - 1 && ditherPattern[6]) {
                                data.data[pixelIndex + canvas.width * 4 - 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4] - redDelta * ditherPattern[6])));
                                data.data[pixelIndex + canvas.width * 4 - 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4 + 1] - greenDelta * ditherPattern[6])));
                                data.data[pixelIndex + canvas.width * 4 - 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 4 + 2] - blueDelta * ditherPattern[6])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[11]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4] - redDelta * ditherPattern[11])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 1] - greenDelta * ditherPattern[11])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 4 + 2] - blueDelta * ditherPattern[11])));
                            }
                        }

                        if (x > 1) {
                            if (y < canvas.height - 1 && ditherPattern[5]) {
                                data.data[pixelIndex + canvas.width * 4 - 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8] - redDelta * ditherPattern[5])));
                                data.data[pixelIndex + canvas.width * 4 - 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8 + 1] - greenDelta * ditherPattern[5])));
                                data.data[pixelIndex + canvas.width * 4 - 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 4 - 8 + 2] - blueDelta * ditherPattern[5])));
                            }

                            if (y < canvas.height - 2 && ditherPattern[10]) {
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8] - redDelta * ditherPattern[10])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 1] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 1] - greenDelta * ditherPattern[10])));
                                data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 2] = Math.round(Math.min(255, Math.max(0, data.data[pixelIndex + canvas.width * 2 * 4 - 8 + 2] - blueDelta * ditherPattern[10])));
                            }
                        }
                    }
                }

                data.data[pixelIndex] = matchingRed;
                data.data[pixelIndex + 1] = matchingGreen;
                data.data[pixelIndex + 2] = matchingBlue;
                data.data[pixelIndex + 3] = 255;
            }
        }
    }

    context.putImageData(data, 0, 0);
}

function createImageWindow(imageInfos) {
    var imageScaleFactor = 1;

    while (imageInfos.Image.width * imageScaleFactor < 640) {
        imageScaleFactor++;
    }

    var originalCanvas = document.createElement("canvas");

    originalCanvas.id = "original_canvas_" + imageInfos.Id;
    originalCanvas.className = "image_canvas_class";
    originalCanvas.width = imageInfos.Image.width;
    originalCanvas.height = imageInfos.Image.height;
    originalCanvas.style.position = "absolute";
    originalCanvas.style.width = originalCanvas.width * imageScaleFactor;

    if (imageInfos.AspectX && imageInfos.AspectY) {
        originalCanvas.style.height = Math.floor(originalCanvas.height * imageScaleFactor * imageInfos.AspectY / imageInfos.AspectX);
    } else {
        originalCanvas.style.height = originalCanvas.height * imageScaleFactor;
    }

    originalCanvas.getContext("2d").drawImage(imageInfos.Image, 0, 0, imageInfos.Image.width, imageInfos.Image.height);

    var displayCanvas = document.createElement("canvas");

    displayCanvas.id = "display_canvas_" + imageInfos.Id;
    displayCanvas.className = "image_canvas_class";
    displayCanvas.width = imageInfos.Image.width;
    displayCanvas.height = imageInfos.Image.height;
    displayCanvas.style.position = "absolute";
    displayCanvas.style.width = originalCanvas.style.width;
    displayCanvas.style.height = originalCanvas.style.height;

    displayCanvas.getContext("2d").drawImage(imageInfos.Image, 0, 0, imageInfos.Image.width, imageInfos.Image.height);

    var paletteCanvas = document.createElement("canvas");

    paletteCanvas.id = "colors_canvas_" + imageInfos.Id;
    paletteCanvas.className = "colors_canvas_class";
    paletteCanvas.width = imageInfos.Image.width;
    paletteCanvas.height = LINE_HEIGHT;
    paletteCanvas.style.position = "absolute";
    paletteCanvas.style.width = originalCanvas.style.width;
    paletteCanvas.style.height = LINE_HEIGHT;

    var windowDiv = document.createElement("div");
    var titleBarDiv = document.createElement("div");
    var menuDiv = document.createElement("div");
    var imageDiv = document.createElement("div");
    var colorsDiv = document.createElement("div");
    var titleTextSpan = document.createElement("span");
    var closeLabel = document.createElement("label");

    windowDiv.ImageInfos = imageInfos;

    windowDiv.id = "window_div_" + imageInfos.Id;
    windowDiv.className = "window_class";
    windowDiv.draggable = "true";
    windowDiv.style.left = (GlobalWindowIdCounter * LINE_HEIGHT) % 640;
    windowDiv.style.top = (GlobalWindowIdCounter * LINE_HEIGHT) % 400;
    windowDiv.style.width = originalCanvas.style.width;
    windowDiv.style.height = parseInt(originalCanvas.style.height, 10) + LINE_HEIGHT + LINE_HEIGHT + LINE_HEIGHT;
    windowDiv.style.zIndex = GlobalWindowZIndexCounter++;

    windowDiv.addEventListener("dragstart", function (e) {
        //noinspection JSUnresolvedVariable
        e.dataTransfer.setData("Text", e.screenX + "," + e.screenY + "," + this.id);
    }, false);

    //noinspection JSUnusedLocalSymbols
    windowDiv.addEventListener("click", function (e) {
        this.style.zIndex = GlobalWindowZIndexCounter++;
    }, false);

    titleBarDiv.id = "title_bar_div_" + imageInfos.Id;
    titleBarDiv.style.width = originalCanvas.style.width;
    titleBarDiv.style.height = LINE_HEIGHT;

    titleTextSpan.id = "title_text_span_" + imageInfos.Id;
    titleTextSpan.style.float = "left";
    titleTextSpan.style.display = "block";
    titleTextSpan.style.textAlign = "center";
    titleTextSpan.style.width = parseInt(displayCanvas.style.width, 10) - LINE_WIDTH;
    titleTextSpan.style.height = "100%";
    titleTextSpan.style.userSelect = "none";
    titleTextSpan.style.backgroundColor = WINDOW_COLOR;
    titleTextSpan.innerHTML = encodeURIComponent(imageInfos.FileName) + " [" + imageInfos.Image.width + " x " + imageInfos.Image.height + ", " + getColors(displayCanvas).length + " colours]";

    titleBarDiv.appendChild(titleTextSpan);

    closeLabel.id = "close_label_" + imageInfos.Id;
    closeLabel.className = "window_button_class";
    closeLabel.style.float = "right";
    closeLabel.style.display = "block";
    closeLabel.style.textAlign = "center";
    closeLabel.style.width = LINE_WIDTH;
    closeLabel.style.height = "100%";
    closeLabel.style.backgroundColor = WINDOW_COLOR;
    closeLabel.innerHTML = "X";

    //noinspection JSUnusedLocalSymbols
    closeLabel.addEventListener("click", function (e) {
        this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
    }, false);

    titleBarDiv.appendChild(closeLabel);

    menuDiv.id = "menu_div_" + imageInfos.Id;
    menuDiv.className = "menu_class";
    menuDiv.style.width = displayCanvas.style.width;
    menuDiv.style.height = LINE_HEIGHT;
    menuDiv.style.overflow = "hidden";

    menuDiv.appendChild(createMenuItem(imageInfos.Id,
        {
            Type:   "checkbox",
            Name:   "global_colors",
            Text:   "Global Colours",
            Action: function () {
                setGlobalColors(this);
            }
        }));

    menuDiv.appendChild(createMenuItem(imageInfos.Id,
        {
            Type:    "label",
            Name:    "colors",
            Text:    "Colours",
            Options: [
                {Name: "original", Text: "Original", Default: true},
                {Name: "─", Text: "────────", Disabled: true},
                {Name: "2", Text: "2"},
                {Name: "4", Text: "4"},
                {Name: "8", Text: "8"},
                {Name: "16", Text: "16"},
                {Name: "32", Text: "32"},
                {Name: "64", Text: "64"},
                {Name: "128", Text: "128"},
                {Name: "256", Text: "256"},
                {Name: "─", Text: "────────", Disabled: true},
                {Name: "zx", Text: "16 (ZX Spectrum)"},
                {Name: "ehb", Text: "64 (EHB)"},
                {Name: "256-884", Text: "256 (8-8-4)"},
                {Name: "palette", Text: "Palette"},
                {Name: "─", Text: "────────", Disabled: true},
                {Name: "global", Text: "Global"}
            ],
            Action:  function () {
                processMenuAction(this.id.substring(this.id.lastIndexOf("_") + 1));
            }
        }));

    menuDiv.appendChild(createMenuItem(imageInfos.Id,
        {
            Type:    "label",
            Name:    "palette",
            Text:    "Palette",
            Options: [
                {Name: "256", Text: "256 (8-8-4)"},
                {Name: "512", Text: "512 (ST)"},
                {Name: "4096", Text: "4096 (STE/OCS/ECS)", Default: true},
                {Name: "262144", Text: "262144 (F030)"},
                {Name: "16777216", Text: "16777216 (AGA)"}
            ],
            Action:  function () {
                processMenuAction(this.id.substring(this.id.lastIndexOf("_") + 1));
            }
        }));

    menuDiv.appendChild(createMenuItem(imageInfos.Id,
        {
            Type:    "label",
            Name:    "dither",
            Text:    "Dither",
            Options: [
                {Name: "none", Text: "None"},
                {Name: "checks", Text: "Checks"},
                {Name: "fs", Text: "Floyd-Steinberg"},
                {Name: "fs85", Text: "Floyd-Steinberg (85%)"},
                {Name: "fs75", Text: "Floyd-Steinberg (75%)", Default: true},
                {Name: "ffs", Text: "False Floyd-Steinberg"},
                {Name: "jjn", Text: "Jarvis, Judice, and Ninke"},
                {Name: "s", Text: "Stucki"},
                {Name: "a", Text: "Atkinson"},
                {Name: "b", Text: "Burkes"},
                {Name: "s", Text: "Sierra"},
                {Name: "trs", Text: "Two-Row Sierra"},
                {Name: "sl", Text: "Sierra Lite"}
            ],
            Action:  function () {
                processMenuAction(this.id.substring(this.id.lastIndexOf("_") + 1));
            }
        }));

    menuDiv.appendChild(createMenuItem(imageInfos.Id,
        {
            Type:   "button",
            Name:   "save",
            Text:   "Save",
            Action: function () {
                saveImage(this.id.substring(this.id.lastIndexOf("_") + 1));
            }
        }));

    imageDiv.id = "image_div_" + imageInfos.Id;
    imageDiv.style.width = originalCanvas.style.width;
    imageDiv.style.height = originalCanvas.style.height;

    imageDiv.appendChild(originalCanvas);
    imageDiv.appendChild(displayCanvas);

    colorsDiv.id = "colors_div_" + imageInfos.Id;
    colorsDiv.style.width = originalCanvas.style.width;
    colorsDiv.style.height = LINE_HEIGHT;

    colorsDiv.appendChild(paletteCanvas);

    windowDiv.appendChild(titleBarDiv);
    windowDiv.appendChild(menuDiv);
    windowDiv.appendChild(imageDiv);
    windowDiv.appendChild(colorsDiv);

    return windowDiv;
}

function createMenuItem(id, item) {
    var menuItemDiv = document.createElement("div"),
        input;

    menuItemDiv.id = "menu_" + item.Name + "_div_" + id;
    menuItemDiv.className = "menu_item_class";
    menuItemDiv.style.height = LINE_HEIGHT;

    switch (item.Type) {
        case "label":
            var label = document.createElement("label"),
                select = document.createElement("select");

            label.id = "menu_" + item.Name + "_label_" + id;
            label.className = "menu_label_class";
            label.style.height = LINE_HEIGHT;
            label.innerHTML = item.Text + ":";
            label.htmlFor = "menu_" + item.Name + "_select_" + id;

            select.id = "menu_" + item.Name + "_select_" + id;
            select.className = "menu_select_class";
            select.style.height = LINE_HEIGHT;
            select.addEventListener("change", item.Action, false);

            for (var i = 0; i < item.Options.length; i++) {
                var option = document.createElement("option");

                option.id = "menu_" + item.Name + "_" + item.Options[i].Name + "_option_" + id;
                option.className = "menu_option_class";
                option.innerHTML = item.Options[i].Text;

                if (item.Options[i].Disabled) {
                    option.disabled = true;
                }

                if (localStorage) {
                    if (localStorage.getItem("menu_" + item.Name + "_select")) {
                        if (localStorage.getItem("menu_" + item.Name + "_select") == item.Options[i].Text) {
                            option.selected = true;
                        }
                    } else if (item.Options[i].Default) {
                        localStorage.setItem("menu_" + item.Name + "_select", item.Options[i].Text);
                        option.selected = true;
                    }
                } else if (item.Options[i].Default) {
                    option.selected = true;
                }

                select.appendChild(option);
            }

            menuItemDiv.appendChild(label);
            menuItemDiv.appendChild(select);
            break;

        case "button":
            input = document.createElement("input");

            input.id = "menu_" + item.Name + "_input_" + id;
            input.className = "menu_input_class";
            input.type = "button";
            input.style.height = LINE_HEIGHT;
            input.value = item.Text;
            input.addEventListener("click", item.Action, false);

            menuItemDiv.appendChild(input);
            break;

        case "checkbox":
            input = document.createElement("input");

            input.id = "menu_" + item.Name + "_input_" + id;
            input.className = "menu_input_class";
            input.type = "checkbox";
            input.style.height = LINE_HEIGHT;
            input.innerHTML = item.Text;
            input.addEventListener("click", item.Action, false);

            menuItemDiv.appendChild(input);
            break;
    }

    return menuItemDiv;
}

function processMenuAction(id) {
    document.getElementById("menu_global_colors_input_" + id).checked = false;

    var originalCanvas = document.getElementById("original_canvas_" + id),
        displayCanvas = document.getElementById("display_canvas_" + id),
        imageInfos = document.getElementById("window_div_" + id).ImageInfos;

    displayCanvas.getContext("2d").drawImage(originalCanvas, 0, 0);

    var colorsSelection = document.getElementById("menu_colors_select_" + id).value,
        paletteSelection = document.getElementById("menu_palette_select_" + id).value,
        ditherSelection = document.getElementById("menu_dither_select_" + id).value;

    var paletteColors = parseInt(paletteSelection.substr(0, paletteSelection.indexOf(" ")));

    if (localStorage) {
        localStorage.setItem("menu_colors_select", colorsSelection);
        localStorage.setItem("menu_palette_select", paletteSelection);
        localStorage.setItem("menu_dither_select", ditherSelection);
    }

    switch (colorsSelection) {
        case "Original":
            imageInfos.QuantizedColors = getColors(displayCanvas);

            break;

        default:
            var ditherPattern = null;

            switch (ditherSelection) {
                case "Checks":
                    ditherPattern = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    break;

                case "Floyd-Steinberg":
                    ditherPattern = [
                        0, 0, 0, 7.0 / 16.0, 0, 0, 3.0 / 16.0, 5.0 / 16.0,
                        1.0 / 16.0, 0, 0, 0, 0, 0, 0
                    ];

                    break;

                case "Floyd-Steinberg (85%)":
                    //noinspection PointlessArithmeticExpressionJS
                    ditherPattern = [
                        0, 0, 0, 7.0 * 0.85 / 16.0, 0, 0, 3.0 * 0.85 / 16.0,
                        5.0 * 0.85 / 16.0, 1.0 * 0.85 / 16.0, 0, 0, 0, 0, 0, 0
                    ];

                    break;

                case "Floyd-Steinberg (75%)":
                    //noinspection PointlessArithmeticExpressionJS
                    ditherPattern = [
                        0, 0, 0, 7.0 * 0.75 / 16.0, 0, 0, 3.0 * 0.75 / 16.0,
                        5.0 * 0.75 / 16.0, 1.0 * 0.75 / 16.0, 0, 0, 0, 0, 0, 0
                    ];

                    break;

                case "False Floyd-Steinberg":
                    ditherPattern = [
                        0, 0, 0, 3.0 / 8.0, 0, 0, 0, 3.0 / 8.0, 2.0 / 8.0, 0,
                        0, 0, 0, 0, 0
                    ];

                    break;

                case "Jarvis, Judice, and Ninke":
                    ditherPattern = [
                        0, 0, 0, 7.0 / 48.0, 5.0 / 48.0, 3.0 / 48.0, 5.0 / 48.0,
                        7.0 / 48.0, 5.0 / 48.0, 3.0 / 48.0, 1.0 / 48.0,
                        3.0 / 48.0, 5.0 / 48.0, 3.0 / 48.0, 1.0 / 48.0
                    ];

                    break;

                case "Stucki":
                    ditherPattern = [
                        0, 0, 0, 8.0 / 42.0, 4.0 / 42.0, 2.0 / 42.0, 4.0 / 42.0,
                        8.0 / 42.0, 4.0 / 42.0, 2.0 / 42.0, 1.0 / 42.0,
                        2.0 / 42.0, 4.0 / 42.0, 2.0 / 42.0, 1.0 / 42.0
                    ];

                    break;

                case "Atkinson":
                    ditherPattern = [
                        0, 0, 0, 1.0 / 8.0, 1.0 / 8.0, 0, 1.0 / 8.0, 1.0 / 8.0,
                        1.0 / 8.0, 0, 0, 0, 1.0 / 8.0, 0, 0
                    ];

                    break;

                case "Burkes":
                    ditherPattern = [
                        0, 0, 0, 8.0 / 32.0, 4.0 / 32.0, 2.0 / 32.0, 4.0 / 32.0,
                        8.0 / 32.0, 4.0 / 32.0, 2.0 / 32.0, 0, 0, 0, 0, 0
                    ];

                    break;

                case "Sierra":
                    ditherPattern = [
                        0, 0, 0, 5.0 / 32.0, 3.0 / 32.0, 2.0 / 32.0, 4.0 / 32.0,
                        5.0 / 32.0, 4.0 / 32.0, 2.0 / 32.0, 0, 2.0 / 32.0,
                        3.0 / 32.0, 2.0 / 32.0, 0
                    ];

                    break;

                case "Two-Row Sierra":
                    ditherPattern = [
                        0, 0, 0, 4.0 / 16.0, 3.0 / 16.0, 1.0 / 16.0, 2.0 / 16.0,
                        3.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0, 0, 0, 0, 0, 0
                    ];

                    break;

                case "Sierra Lite":
                    ditherPattern = [
                        0, 0, 0, 2.0 / 4.0, 0, 0, 1.0 / 4.0, 1.0 / 4.0, 0, 0,
                        0, 0, 0, 0, 0
                    ];

                    break;
            }

            var bitsPerColor = 1;

            if (paletteColors == 256) {
                bitsPerColor = 332;
            } else {
                while (Math.pow(Math.pow(2, bitsPerColor), 3) < paletteColors) {
                    bitsPerColor++;
                }
            }

            processImage(imageInfos, displayCanvas, colorsSelection, bitsPerColor,
                "RGBL", ditherPattern);

            break;
    }

    displayColors(imageInfos.QuantizedColors, id);
}

function processImage(imageInfos, imageCanvas, colorCount, bitsPerColor, remappingMethod, ditherPattern) {
    var ehbMode = false,
        colors = [],
        i, maxRecursionDepth, colorCube, colorCubeInfo, shadesPerColor,
        red, green, blue;

    if (colorCount == "Global") {
        for (i = 0; i < GlobalColors.length; i++)
            colors.push({
                Red: GlobalColors[i].Red, Green: GlobalColors[i].Green, Blue: GlobalColors[i].Blue
            });
    } else if (colorCount == "16 (ZX Spectrum)") {
        colors.push({Red: 0x00, Green: 0x00, Blue: 0x00});
        colors.push({Red: 0x00, Green: 0x00, Blue: 0xcd});
        colors.push({Red: 0xcd, Green: 0x00, Blue: 0x00});
        colors.push({Red: 0xcd, Green: 0x00, Blue: 0xcd});
        colors.push({Red: 0x00, Green: 0xcd, Blue: 0x00});
        colors.push({Red: 0x00, Green: 0xcd, Blue: 0xcd});
        colors.push({Red: 0xcd, Green: 0xcd, Blue: 0x00});
        colors.push({Red: 0xcd, Green: 0xcd, Blue: 0xcd});

        colors.push({Red: 0x00, Green: 0x00, Blue: 0x00});
        colors.push({Red: 0x00, Green: 0x00, Blue: 0xff});
        colors.push({Red: 0xff, Green: 0x00, Blue: 0x00});
        colors.push({Red: 0xff, Green: 0x00, Blue: 0xff});
        colors.push({Red: 0x00, Green: 0xff, Blue: 0x00});
        colors.push({Red: 0x00, Green: 0xff, Blue: 0xff});
        colors.push({Red: 0xff, Green: 0xff, Blue: 0x00});
        colors.push({Red: 0xff, Green: 0xff, Blue: 0xff});
    } else if (colorCount == "16 (PCHG)" || colorCount == "32 (PCHG)") {
        colorCount = colorCount.substr(0, colorCount.indexOf(" "));

        maxRecursionDepth = 1;

        while (Math.pow(2, maxRecursionDepth) < colorCount) {
            maxRecursionDepth++;
        }

        imageInfos.LineColors = [];

        for (var lineIndex = 0; lineIndex < imageCanvas.height; lineIndex++) {
            var lineCanvas = document.createElement("canvas");

            lineCanvas.width = imageCanvas.width;
            lineCanvas.height = 1;

            lineCanvas.getContext("2d").drawImage(imageCanvas, 0, lineIndex, imageCanvas.width, 1, 0, 0, imageCanvas.width, 1);

            colorCube = createColorCube(lineCanvas);

            colorCubeInfo = trimColorCube(colorCube, {
                RedMin: 0, RedMax: 255, GreenMin: 0, GreenMax: 255, BlueMin: 0, BlueMax: 255
            });

            colors = [];

            quantizeRecursive(colorCube, colorCubeInfo, colors, 0, maxRecursionDepth);

            colors.sort(function (Color1, Color2) {
                return (Color1.Red * 0.21 + Color1.Green * 0.72 + Color1.Blue * 0.07) - (Color2.Red * 0.21 + Color2.Green * 0.72 + Color2.Blue * 0.07)
            });

            shadesPerColor = 1 << bitsPerColor;

            for (i = 0; i < colors.length; i++) {
                colors[i].Red = Math.floor(Math.floor(colors[i].Red * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));
                colors[i].Green = Math.floor(Math.floor(colors[i].Green * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));
                colors[i].Blue = Math.floor(Math.floor(colors[i].Blue * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));
            }

            imageInfos.LineColors.push(colors);
        }
    } else if (colorCount == "256 (8-8-4)") {
        for (red = 0; red < 256; red += 255.0 / 7.0) {
            for (green = 0; green < 256; green += 255.0 / 7.0) {
                for (blue = 0; blue < 256; blue += 255.0 / 3.0) {
                    colors.push({Red: Math.round(red), Green: Math.round(green), Blue: Math.round(blue)});
                }
            }
        }
    } else if (colorCount == "Palette") {
        colors.push({Red: 0, Green: 0, Blue: 0});
        colors.push({Red: 255, Green: 255, Blue: 255});
    } else {
        if (colorCount == "64 (EHB)") {
            ehbMode = true;
            colorCount = 32;
        }

        if (!imageInfos.Colors || imageInfos.Colors.length > colorCount) {
            colorCube = createColorCube(imageCanvas);

            colorCubeInfo = trimColorCube(colorCube, {
                RedMin: 0, RedMax: 255, GreenMin: 0, GreenMax: 255, BlueMin: 0, BlueMax: 255
            });

            if (colorCount == 2) {
                colors.push({Red: 0, Green: 0, Blue: 0});
                colors.push({Red: 255, Green: 255, Blue: 255});
            } else {
                maxRecursionDepth = 1;

                while (Math.pow(2, maxRecursionDepth) < colorCount) {
                    maxRecursionDepth++;
                }

                quantizeRecursive(colorCube, colorCubeInfo, colors, 0, maxRecursionDepth);

                colors.sort(function (Color1, Color2) {
                    return (Color1.Red * 0.21 + Color1.Green * 0.72 + Color1.Blue * 0.07) - (Color2.Red * 0.21 + Color2.Green * 0.72 + Color2.Blue * 0.07)
                });

                if (colors.length < colorCount) {
                    console.warn("Warning: " + colors.length + "/" + colorCount + " colors!");
                }

                if (ehbMode) {
                    while (colors.length < 64) {
                        colors.push({Red: 0, Green: 0, Blue: 0});
                    }

                    for (i = 0; i < 32; i++) {
                        red = colors[i].Red;
                        green = colors[i].Green;
                        blue = colors[i].Blue;

                        if (Math.max(red, green, blue) >= 128) {
                            colors[i + 32].Red = Math.floor(red / 2.0);
                            colors[i + 32].Green = Math.floor(green / 2.0);
                            colors[i + 32].Blue = Math.floor(blue / 2.0);
                        } else {
                            colors[i + 32].Red = red;
                            colors[i + 32].Green = green;
                            colors[i + 32].Blue = blue;

                            colors[i].Red = red * 2;
                            colors[i].Green = green * 2;
                            colors[i].Blue = blue * 2;
                        }
                    }
                }
            }
        } else {
            for (i = 0; i < imageInfos.Colors.length; i++) {
                colors.push({
                    Red:  imageInfos.Colors[i].Red, Green: imageInfos.Colors[i].Green,
                    Blue: imageInfos.Colors[i].Blue
                });
            }
        }

        if (bitsPerColor == "332") {
            for (i = 0; i < colors.length; i++) {
                colors[i].Red = Math.floor(Math.floor(colors[i].Red * 8.0 / 256.0) * (255.0 / (8.0 - 1.0)));
                colors[i].Green = Math.floor(Math.floor(colors[i].Green * 8.0 / 256.0) * (255.0 / (8.0 - 1.0)));
                colors[i].Blue = Math.floor(Math.floor(colors[i].Blue * 4.0 / 256.0) * (255.0 / (4.0 - 1.0)));
            }
        } else {
            shadesPerColor = 1 << bitsPerColor;

            for (i = 0; i < colors.length; i++) {
                colors[i].Red = Math.floor(Math.floor(colors[i].Red * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));
                colors[i].Green = Math.floor(Math.floor(colors[i].Green * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));
                colors[i].Blue = Math.floor(Math.floor(colors[i].Blue * shadesPerColor / 256.0) * (255.0 / (shadesPerColor - 1.0)));
            }
        }
    }

    // Remap image
    if (colorCount == "16 (ZX Spectrum)") {
        remapZxSpectrumImageLuminance1(imageCanvas, colors, ditherPattern);
    }
    else if (imageInfos.LineColors) {
        remapLineColorsImageLuminance(imageCanvas, imageInfos.LineColors, ditherPattern);
    }
    else if (colorCount == "Palette") {
        remapFullPaletteImageLuminance(imageCanvas, bitsPerColor, ditherPattern);
    }
    else {
        switch (remappingMethod) {
            case "RGB":
                remapImage(imageCanvas, colors, ditherPattern);

                break;

            case "RGBL":
                remapImageLuminance(imageCanvas, colors, ditherPattern);

                break;
        }
    }

    imageInfos.QuantizedColors = colors;
}

function displayColors(colors, id) {
    var colorsCanvas = document.getElementById("colors_canvas_" + id),
        colorsContext = colorsCanvas.getContext("2d"),
        colorsData = colorsContext.getImageData(0, 0, colorsCanvas.width, colorsCanvas.height);

    for (var x = 0; x < colorsCanvas.width; x++) {
        var colorsIndex = Math.floor(x * colors.length / colorsCanvas.width);

        for (var y = 0; y < colorsCanvas.height; y++) {
            var pixelIndex = (x + y * colorsCanvas.width) * 4;

            colorsData.data[pixelIndex] = colors[colorsIndex].Red;
            colorsData.data[pixelIndex + 1] = colors[colorsIndex].Green;
            colorsData.data[pixelIndex + 2] = colors[colorsIndex].Blue;
            colorsData.data[pixelIndex + 3] = 255;
        }
    }

    colorsContext.putImageData(colorsData, 0, 0);
}

function saveImage(id) {
    var imageInfos = document.getElementById("window_div_" + id).ImageInfos,
        formatSelection = "IFF",
        canvas = document.getElementById("display_canvas_" + id),
        colors;

    if (imageInfos.Colors) {
        colors = imageInfos.Colors;
    } else {
        colors = getColors(canvas);
    }

    switch (formatSelection) {
        case "IFF":
            saveIff(canvas, colors);
            break;
    }
}

function writeIffChunkHeader(data, dataIndex, id, size) {
    for (var i = 0; i < id.length; i++) {
        data[dataIndex++] = id.charCodeAt(i);
    }

    data[dataIndex++] = (size >> 24) & 0xff;
    data[dataIndex++] = (size >> 16) & 0xff;
    data[dataIndex++] = (size >> 8) & 0xff;
    data[dataIndex++] = size & 0xff;

    return dataIndex;
}

function saveIff(canvas, colors) {
    var numberOfBitPlanes = 1;

    while ((1 << numberOfBitPlanes) < colors.length) {
        numberOfBitPlanes++;
    }

    var dataIndex = 0,
        adjustedImageWidth = Math.ceil(canvas.width / 16) * 16,
        bytesPerLine = adjustedImageWidth / 8,
        copyright = "http://pointofpresence.ru",
        i;

    // "FORM" + size + "ILBM" + "BMHD" + size + 20
    // + "CMAP" + size + "ANNO" + size
    // + copyright + "BODY" + size.
    var dataSize = 4 + 4 + 4 + 4 + 4 + 20 + 4 + 4 + 4 + 4 + (copyright.length + 1) + 4 + 4;

    dataSize += colors.length * 3 + bytesPerLine * numberOfBitPlanes * canvas.height + (((colors.length * 3) & 1) ? 1 : 0);

    var data = new Uint8Array(dataSize);

    // "FORM"
    dataIndex = writeIffChunkHeader(data, dataIndex, "FORM", dataSize - 8);

    for (i = 0; i < 4; i++) {
        data[dataIndex++] = "ILBM".charCodeAt(i);
    }

    // "BMHD"
    dataIndex = writeIffChunkHeader(data, dataIndex, "BMHD", 20);

    data[dataIndex++] = (adjustedImageWidth >> 8) & 0xff;
    data[dataIndex++] = adjustedImageWidth & 0xff;

    data[dataIndex++] = (canvas.height >> 8) & 0xff;
    data[dataIndex++] = canvas.height & 0xff;

    data[dataIndex++] = 0;
    data[dataIndex++] = 0;
    data[dataIndex++] = 0;
    data[dataIndex++] = 0;

    data[dataIndex++] = numberOfBitPlanes;

    data[dataIndex++] = 0;
    data[dataIndex++] = 0;
    data[dataIndex++] = 0;
    data[dataIndex++] = 0;
    data[dataIndex++] = 0;
    data[dataIndex++] = 1;
    data[dataIndex++] = 1;

    data[dataIndex++] = (adjustedImageWidth >> 8) & 0xff;
    data[dataIndex++] = adjustedImageWidth & 0xff;

    data[dataIndex++] = (canvas.height >> 8) & 0xff;
    data[dataIndex++] = canvas.height & 0xff;

    // "CMAP"
    dataIndex = writeIffChunkHeader(data, dataIndex, "CMAP", colors.length * 3);

    for (i = 0; i < colors.length; i++) {
        data[dataIndex++] = colors[i].Red;
        data[dataIndex++] = colors[i].Green;
        data[dataIndex++] = colors[i].Blue;
    }

    //noinspection JSBitwiseOperatorUsage
    if ((colors.length * 3) & 1) {
        data[dataIndex++] = 0;
    }

    // "ANNO"
    dataIndex = writeIffChunkHeader(data, dataIndex, "ANNO", 22);

    for (i = 0; i < copyright.length; i++) {
        data[dataIndex++] = copyright.charCodeAt(i);
    }

    // "BODY"
    dataIndex = writeIffChunkHeader(data, dataIndex, "BODY", bytesPerLine * numberOfBitPlanes * canvas.height);

    var bitPlaneLines = new Array(numberOfBitPlanes),
        context = canvas.getContext("2d"),
        imageData = context.getImageData(0, 0, canvas.width, canvas.height),
        bitPlaneIndex;

    for (var y = 0; y < canvas.height; y++) {
        for (i = 0; i < numberOfBitPlanes; i++) {
            bitPlaneLines[i] = new Uint8Array(bytesPerLine);
        }

        for (var x = 0; x < canvas.width; x++) {
            var pixelIndex = (x + y * canvas.width) * 4;

            var red = imageData.data[pixelIndex];
            var green = imageData.data[pixelIndex + 1];
            var blue = imageData.data[pixelIndex + 2];
            var alpha = imageData.data[pixelIndex + 3];

            var colorIndex = 0;

            if (alpha == 255)
                for (colorIndex = 0; colorIndex < colors.length; colorIndex++)
                    if (red == colors[colorIndex].Red && green == colors[colorIndex].Green && blue == colors[colorIndex].Blue)
                        break;

            for (bitPlaneIndex = 0; bitPlaneIndex < numberOfBitPlanes; bitPlaneIndex++) {
                //noinspection JSBitwiseOperatorUsage
                if (colorIndex & (1 << bitPlaneIndex)) {
                    bitPlaneLines[bitPlaneIndex][x >> 3] |= 0x80 >> (x & 7);
                }
            }
        }

        for (bitPlaneIndex = 0; bitPlaneIndex < numberOfBitPlanes; bitPlaneIndex++)
            for (var byteIndex = 0; byteIndex < bytesPerLine; byteIndex++)
                data[dataIndex++] = bitPlaneLines[bitPlaneIndex][byteIndex];
    }

    // Save file
    var downloadLink = document.createElement("a");

    downloadLink.download = "IMAGE.IFF";
    downloadLink.innerHTML = "Download Image";

    //noinspection JSUnresolvedVariable
    if (window.webkitURL != null) {
        //noinspection JSUnresolvedVariable,JSUnresolvedFunction
        downloadLink.href = window.webkitURL.createObjectURL(new Blob([data], {type: "application/octet-binary"}));
    } else {
        //noinspection JSUnresolvedVariable,JSUnresolvedFunction
        downloadLink.href = URL.createObjectURL(new Blob([data], {type: "application/octet-binary"}));

        downloadLink.onclick = function (e) {
            document.body.removeChild(e.target);
        };

        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}

function setGlobalColors(element) {
    if (element.checked) {
        var id = element.id.substring(element.id.lastIndexOf("_") + 1);

        GlobalColors = document.getElementById("window_div_" + id).ImageInfos.QuantizedColors;

        var windowDivs = document.getElementById("dropzone").children;

        for (var i = 0; i < windowDivs.length; i++) {
            if (windowDivs[i].id.indexOf("window_div_") == 0) {
                var windowId = windowDivs[i].id.substring(windowDivs[i].id.lastIndexOf("_") + 1);

                if (id != windowId) {
                    document.getElementById("menu_global_colors_input_" + windowId).checked = false;

                    if (document.getElementById("menu_colors_select_" + windowId).value == "Global") {
                        processMenuAction(windowId);
                    }
                }
            }
        }
    } else {
        GlobalColors = [];

        GlobalColors.push({Red: 0, Green: 0, Blue: 0});
        GlobalColors.push({Red: 255, Green: 255, Blue: 255});
    }
}