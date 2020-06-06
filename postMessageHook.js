window.addEventListener("message", event => {
    if (event.origin !== allowedParentOrigin) return;
    let action;
    let data;
    try {
        const eventData = JSON.parse(event.data);
        action = eventData.action;
        data = eventData.data;
    } catch {
        console.log("Invalid object.");
    }

    const accessToken = getAccessToken();
    const headers = new Headers();
    appendAuthorizationHeader(headers);
    const baseUri = "https://nktpluginscommit.azurewebsites.net/api";

    const { name, isPrivate } = data;
    const queryString = `?name=${encodeURIComponent(name)}&isPrivate=${encodeURIComponent(isPrivate)}&accessToken=${encodeURIComponent(accessToken)}`;

    switch (action) {
        case "commit": // expecting data looking like { name: "pluginName", isPrivate: true, text: "" }
            const { text } = data;

            const headers = new Headers();
            headers.append("content-type", "application/javascript");

            fetch(`${baseUri}/commit${queryString}`, { method: "POST", body: text, headers: headers })
                .then(response => console.log(response.status))
                .catch(reason => console.log(reason));
            break;
        case "delete": // expecting data looking like { name: "pluginName", isPrivate: true }

            fetch(`${baseUri}/delete${queryString}`, { method: "DELETE" })
                .then(response => console.log(response.status))
                .catch(reason => console.log(reason));
            break;
        default:
            console.log("Invalid action: " + action);
    }
});