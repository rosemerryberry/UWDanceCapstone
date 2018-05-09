"use strict";

refreshLocalUser();

var newRoleForm = document.querySelector(".newRole-form");
var errorBox = document.querySelector(".js-error");
var roleName = document.getElementById("roleName-input");
var displayName = document.getElementById("displayName-input");
var level = document.getElementById("level-input");

getRoles();

newRoleForm.addEventListener("submit", function (evt) {
    evt.preventDefault();
    var payload = {
        "name": roleName.value,
        "displayName": displayName.value,
        "level": Number(level.value),
    };
    makeRequest("roles", payload, "POST", true)
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            return res.text().then((t) => Promise.reject(t));
        })
        .then((data) => {
            alert("New user role successfully created.");
            location.reload();
        })
        .catch((err) => {
            errorBox.textContent = err;
        })
})


// get roles
function getRoles() {
    makeRequest("roles", {}, "GET", true)
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            return res.text().then((t) => Promise.reject(t));
        })
        .then((data) => {
            $(data).each(function (index, value) {
                $("ul").append("<li>" + value.displayName + "</li>")
            });
        })
}

