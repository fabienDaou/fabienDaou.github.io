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
            const body = {
                message: `Plugin ${name} created.`,
                branch: "master",
                content: btoa(data.text),
                committer: {
                    name: "fabienDaou",
                    email: "fabien.daoulas@gmail.com"
                }
            };

            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${name}.js`,
                {
                    method: "PUT",
                    headers: headers,
                    body: JSON.stringify(body)
                })
                .then(response => {
                    console.log("Successfully created.");
                    response.json().then(json => console.log(`File sha: ${json.content.sha}`));
                })
                .catch(reason => console.log(reason));
            break;
        case "delete": // expecting data looking like { name: "pluginName", sha: "", isPrivate: true }
            const body = {
                message: `Plugin ${name} deleted.`,
                branch: "master",
                sha: data.sha,
                committer: {
                    name: "fabienDaou",
                    email: "fabien.daoulas@gmail.com"
                }
            };
            fetch(`${baseGithubApiUri}/${repositoryName}/${githubPluginPath}/${name}.js`,
                {
                    method: "DELETE",
                    headers: headers,
                    body: JSON.stringify(body)
                })
                .then(response => console.log("Successfully deleted."))
                .catch(reason => console.log(reason));
            break;
        default:
            console.log("Invalid action: " + action);
    }
});