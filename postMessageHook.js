const getRepositoryName = private => private ? "nkt-plugins-private" : "nkt-plugins";
const baseGithubApiUri = "https://api.github.com/repos/fabienDaou";
const githubPluginPath = "contents/plugins";

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

    const headers = new Headers();
    headers.append("content-type", "application/json; charset=utf-8");
    appendAuthorizationHeader(headers);

    const { name, isPrivate } = data;
    const repositoryName = getRepositoryName(isPrivate);

    switch (action) {
        case "create": // expecting data looking like { name: "pluginName", isPrivate: true, text: "" }
            const createBody = {
                message: `Plugin ${name} created.`,
                branch: "master",
                content: btoa(data.text),
                committer: {
                    name: "fabienDaou",
                    email: "fabien.daoulas@gmail.com"
                }
            };

            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`,
                {
                    method: "PUT",
                    headers: headers,
                    body: JSON.stringify(createBody)
                })
                .then(response => response.json().then(json => postEvent("pluginCreationSuccessful", { name, sha: json.content.sha })))
                .catch(reason => postEvent("pluginCreationFailed", { name, reason }));
            break;
        case "update": // expecting data looking like { name: "pluginName", isPrivate: true, text: "" }
            const { text } = data;
            const updateBody = {
                message: `Plugin ${name} updated.`,
                branch: "master",
                content: btoa(text),
                committer: {
                    name: "fabienDaou",
                    email: "fabien.daoulas@gmail.com"
                }
            };
            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`)
            .then(response => response.json())
            .then(json => {
                updateBody.sha = json.sha;
                fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`,
                {
                    method: "PUT",
                    headers: headers,
                    body: JSON.stringify(updateBody)
                })
                .then(response => response.json().then(json => postEvent("pluginUpdateSuccessful", { name, sha: json.content.sha })))
                .catch(reason => postEvent("pluginUpdateFailed", { name, reason }));
            })
            .catch(reason => postEvent("pluginUpdateFailed", { name, reason }));
            break;
        case "delete": // expecting data looking like { name: "pluginName", isPrivate: true }
            const deleteBody = {
                message: `Plugin ${name} deleted.`,
                branch: "master",
                committer: {
                    name: "fabienDaou",
                    email: "fabien.daoulas@gmail.com"
                }
            };
            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`)
            .then(response => response.json())
            .then(json => {
                deleteBody.sha = json.sha;
                fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`,
                {
                    method: "DELETE",
                    headers: headers,
                    body: JSON.stringify(deleteBody)
                })
                .then(response => postEvent("pluginDeletionSuccessful", { name }))
                .catch(reason => postEvent("pluginDeletionFailed", { name, reason }));
            })
            .catch(reason => postEvent("pluginDeletionFailed", { name, reason }));
            break;
        case "getText":
            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`,
                {
                    method: "GET",
                    headers: headers
                })
                .then(response => response.json().then(json => postEvent("pluginTextSuccessful", { name, text: atob(json.content) })))
                .catch(reason => postEvent("pluginTextFailed", { name, reason }));
            break;
        default:
            console.log("Invalid action: " + action);
    }
});