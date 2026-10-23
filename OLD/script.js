function showProject(id) {

    // Hide all projects
    const projects = document.querySelectorAll('.project');
    projects.forEach(project => {
        project.classList.remove('active');
    });

    // Show selected project
    const activeProject = document.getElementById(id);
    if (activeProject) {
        activeProject.classList.add('active');
    }

    // Reset all nav links
    const links = document.querySelectorAll('.project-link');
    links.forEach(link => {
        link.classList.remove('active-link');
    });

    // Highlight clicked link
    const activeLink = Array.from(links).find(link =>
        link.getAttribute('onclick').includes(id)
    );

    if (activeLink) {
        activeLink.classList.add('active-link');
    }
}