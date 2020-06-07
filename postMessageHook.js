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
    headers.append("content-type", "application/json");
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
        case "update": // expecting data looking like { name: "pluginName", isPrivate: true, text: "", sha: "" }
            const { text, sha } = data;
            const updateBody = {
                message: `Plugin ${name} updated.`,
                branch: "master",
                content: btoa(text),
                sha,
                committer: {
                    name: "fabienDaou",
                    email: "fabien.daoulas@gmail.com"
                }
            };

            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`,
                {
                    method: "PUT",
                    headers: headers,
                    body: JSON.stringify(updateBody)
                })
                .then(response => response.json().then(json => postEvent("pluginUpdateSuccessful", { name, sha: json.content.sha })))
                .catch(reason => postEvent("pluginUpdateFailed", { name, reason }));
            break;
        case "delete": // expecting data looking like { name: "pluginName", sha: "", isPrivate: true }
            const deleteBody = {
                message: `Plugin ${name} deleted.`,
                branch: "master",
                sha: data.sha,
                committer: {
                    name: "fabienDaou",
                    email: "fabien.daoulas@gmail.com"
                }
            };
            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`,
                {
                    method: "DELETE",
                    headers: headers,
                    body: JSON.stringify(deleteBody)
                })
                .then(response => postEvent("pluginDeletionSuccessful", { name }))
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
        case "getSha":
            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${encodeURIComponent(name)}.js`,
                {
                    method: "GET",
                    headers: headers
                })
                .then(response => response.json().then(json => postEvent("pluginShaSuccessful", { name, sha: json.sha })))
                .catch(reason => postEvent("pluginShaFailed", { name, reason }));
            break;
        default:
            console.log("Invalid action: " + action);
    }
});