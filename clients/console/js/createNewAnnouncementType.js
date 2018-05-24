"use strict";

refreshLocalUser();

var newAnnouncementTypeForm = document.querySelector(".newAnnouncementType-form");
var errorBox = document.querySelector(".js-error");
var announcementTypeName = document.getElementById("announcementTypeName-input");
var description = document.getElementById("description-input");

var announcementTypes = [];

getAnnouncementTypes()

newAnnouncementTypeForm.addEventListener("submit", function (evt) {
    evt.preventDefault();
    var payload = {
        "name": announcementTypeName.value,
        "desc": description.value,
    };
    makeRequest("announcements/types", payload, "POST", true)
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            return res.text().then((t) => Promise.reject(t));
        })
        .then((data) => {
            alert("New announcement type successfully created.");
            $('input').val('');
            $('.newAnnouncementType-form')[0].reset();
            location.reload();
        })
        .catch((err) => {
            errorBox.textContent = err;
        })
})


// get announcement types
function getAnnouncementTypes() {
    makeRequest("announcements/types?inclueDeleted=false", {}, "GET", true)
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            return res.text().then((t) => Promise.reject(t));
        })
        .then((data) => {
            $(data).each(function (index, value) {
                var announcementInfo = [];
                announcementInfo.push(value.name);
                announcementInfo.push(value.desc)
                announcementTypes.push(announcementInfo)
            });
        })
        .then(() => {
            populateAnnouncementTypeTable();
        })
}

function populateAnnouncementTypeTable() {
    var rows = []
    rows.push('<tr>' +
        '<th>Announcement Name</th>' +
        '<th>Announcement Description</th></tr>')
    rows.push($.map(announcementTypes, function (value, index) {
        return '<tr><td>' + value[0] + '</td><td>' + value[1] + '</td></tr>';
    }));
    $('#announcement_type_info').html(rows.join(''));
}