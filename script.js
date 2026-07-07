let fileInput =
    document.getElementById("fileInput");

let dropArea =
    document.getElementById("dropArea");


pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


function chooseFile() {

    fileInput.click();
}


fileInput.addEventListener("change", function() {

    let file = fileInput.files[0];

    if (file != undefined) {

        analyzeFile(file);
    }
});


dropArea.addEventListener("dragover", function(event) {

    event.preventDefault();

    dropArea.classList.add("dragging");
});


dropArea.addEventListener("dragleave", function() {

    dropArea.classList.remove("dragging");
});


dropArea.addEventListener("drop", function(event) {

    event.preventDefault();

    dropArea.classList.remove("dragging");

    let file = event.dataTransfer.files[0];

    if (file != undefined) {

        analyzeFile(file);
    }
});


function analyzeFile(file) {

    let isImage =
        file.type.startsWith("image/");

    let isPDF =
        file.type == "application/pdf";


    if (isImage == false && isPDF == false) {

        alert("Please upload an image or PDF file");

        return;
    }


    showBasicInfo(file);


    if (isImage) {

        analyzeImage(file);

    } else {

        analyzePDF(file);
    }
}


function showBasicInfo(file) {

    document.getElementById("resultSection").style.display =
        "block";

    document.getElementById("dropArea").style.display =
        "none";


    document.getElementById("fileName").innerText =
        file.name;

    document.getElementById("fileTypeLabel").innerText =
        file.type.startsWith("image/")
        ? "IMAGE"
        : "PDF";

    document.getElementById("fileSummary").innerText =
        formatSize(file.size) + " • " + file.type;


    let creationDate =
        "Not available through Browser File API";


    document.getElementById("fileInfo").innerHTML =

        infoRow("File Name", file.name) +

        infoRow("File Size", formatSize(file.size)) +

        infoRow("MIME Type", file.type || "Unknown") +

        infoRow(
            "Last Modified",
            new Date(file.lastModified).toLocaleString()
        ) +

        infoRow(
            "Creation Date",
            creationDate
        );
}


function analyzeImage(file) {

    document.getElementById("mediaTitle").innerText =
        "Image Information";

    document.getElementById("mediaSubtitle").innerText =
        "Image dimensions and properties";

    document.getElementById("cameraCard").style.display =
        "block";

    document.getElementById("locationCard").style.display =
        "block";


    let reader = new FileReader();


    reader.onload = function(event) {

        let image =
            new Image();


        image.onload = function() {

            document.getElementById("mediaInfo").innerHTML =

                infoRow("Width", image.naturalWidth + " px") +

                infoRow("Height", image.naturalHeight + " px") +

                infoRow(
                    "Aspect Ratio",
                    getAspectRatio(
                        image.naturalWidth,
                        image.naturalHeight
                    )
                ) +

                infoRow(
                    "Megapixels",
                    (
                        image.naturalWidth *
                        image.naturalHeight /
                        1000000
                    ).toFixed(2) + " MP"
                );
        };


        image.src =
            event.target.result;


        document.getElementById("previewArea").innerHTML =

            '<img src="' +
            event.target.result +
            '">';


        readExif(file);
    };


    reader.readAsDataURL(file);
}


function readExif(file) {

    EXIF.getData(file, function() {

        let make =
            EXIF.getTag(this, "Make");

        let model =
            EXIF.getTag(this, "Model");

        let date =
            EXIF.getTag(this, "DateTimeOriginal");

        let exposure =
            EXIF.getTag(this, "ExposureTime");

        let iso =
            EXIF.getTag(this, "ISOSpeedRatings");

        let focal =
            EXIF.getTag(this, "FocalLength");

        let latitude =
            EXIF.getTag(this, "GPSLatitude");

        let latitudeRef =
            EXIF.getTag(this, "GPSLatitudeRef");

        let longitude =
            EXIF.getTag(this, "GPSLongitude");

        let longitudeRef =
            EXIF.getTag(this, "GPSLongitudeRef");


        document.getElementById("cameraInfo").innerHTML =

            infoRow(
                "Manufacturer",
                make || "Not available"
            ) +

            infoRow(
                "Camera Model",
                model || "Not available"
            ) +

            infoRow(
                "Date Taken",
                date || "Not available"
            ) +

            infoRow(
                "Exposure",
                exposure || "Not available"
            ) +

            infoRow(
                "ISO",
                iso || "Not available"
            ) +

            infoRow(
                "Focal Length",
                focal
                ? focal + " mm"
                : "Not available"
            );


        if (latitude && longitude) {

            let lat =
                convertGPS(latitude);

            let lon =
                convertGPS(longitude);


            if (latitudeRef == "S") {

                lat = -lat;
            }


            if (longitudeRef == "W") {

                lon = -lon;
            }


            document.getElementById("locationInfo").innerHTML =

                infoRow(
                    "Latitude",
                    lat.toFixed(6)
                ) +

                infoRow(
                    "Longitude",
                    lon.toFixed(6)
                );

        } else {

            document.getElementById("locationInfo").innerHTML =

                infoRow(
                    "GPS Data",
                    "Not available in this image"
                );
        }
    });
}


async function analyzePDF(file) {

    document.getElementById("mediaTitle").innerText =
        "PDF Information";

    document.getElementById("mediaSubtitle").innerText =
        "Document properties";

    document.getElementById("cameraCard").style.display =
        "none";

    document.getElementById("locationCard").style.display =
        "none";


    document.getElementById("previewArea").innerHTML =

        '<div class="pdf-preview">PDF</div>';


    try {

        let data =
            await file.arrayBuffer();

        let pdf =
            await pdfjsLib.getDocument({
                data: data
            }).promise;


        let metadata =
            await pdf.getMetadata();


        let info =
            metadata.info || {};


        document.getElementById("mediaInfo").innerHTML =

            infoRow(
                "Pages",
                pdf.numPages
            ) +

            infoRow(
                "Title",
                info.Title || "Not available"
            ) +

            infoRow(
                "Author",
                info.Author || "Not available"
            ) +

            infoRow(
                "Creator",
                info.Creator || "Not available"
            ) +

            infoRow(
                "Producer",
                info.Producer || "Not available"
            ) +

            infoRow(
                "PDF Version",
                info.PDFFormatVersion || "Not available"
            );

    } catch (error) {

        document.getElementById("mediaInfo").innerHTML =

            infoRow(
                "PDF Analysis",
                "Unable to read PDF metadata"
            );
    }
}


function infoRow(label, value) {

    return (
        '<div class="info-row">' +

            '<span class="info-label">' +
            escapeText(String(label)) +
            '</span>' +

            '<span class="info-value">' +
            escapeText(String(value)) +
            '</span>' +

        '</div>'
    );
}


function formatSize(bytes) {

    if (bytes < 1024) {

        return bytes + " Bytes";
    }


    if (bytes < 1024 * 1024) {

        return (
            bytes / 1024
        ).toFixed(2) + " KB";
    }


    return (
        bytes / (1024 * 1024)
    ).toFixed(2) + " MB";
}


function getAspectRatio(width, height) {

    let divisor =
        getGCD(width, height);

    return (
        width / divisor +
        ":" +
        height / divisor
    );
}


function getGCD(a, b) {

    while (b != 0) {

        let temp = b;

        b = a % b;

        a = temp;
    }

    return a;
}


function convertGPS(value) {

    let degrees =
        value[0];

    let minutes =
        value[1];

    let seconds =
        value[2];

    return (
        degrees +
        minutes / 60 +
        seconds / 3600
    );
}


function escapeText(text) {

    let div =
        document.createElement("div");

    div.innerText =
        text;

    return div.innerHTML;
}


function resetApp() {

    fileInput.value = "";

    document.getElementById("resultSection").style.display =
        "none";

    document.getElementById("dropArea").style.display =
        "block";

    document.getElementById("previewArea").innerHTML =
        "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}