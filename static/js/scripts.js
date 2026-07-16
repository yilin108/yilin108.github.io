const content_dir = 'contents/';
const profile_file = '改这里.yml';

const allowedUrlProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

const defaultBackgrounds = [
    'static/assets/background/1.jpeg',
    'static/assets/background/2.jpeg',
];

function decodeText(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(value);
    return textarea.value;
}

function textOf(value) {
    if (value == null) {
        return '';
    }
    return decodeText(String(value).trim());
}

function isEmptyLink(value) {
    const text = textOf(value);
    return !text || text === '无' || text === '-' || text.toLowerCase() === 'n/a';
}

function isShown(value) {
    const text = textOf(value).toLowerCase();
    if (!text) {
        return true;
    }
    return ['是', 'yes', 'true', '显示', 'on', '1'].includes(text);
}

function getListSection(profile, key, requiredField) {
    const section = profile[key];
    let shown = true;
    let items = [];

    if (Array.isArray(section)) {
        items = section;
    } else if (section && typeof section === 'object') {
        shown = isShown(section['显示']);
        items = Array.isArray(section['列表']) ? section['列表'] : [];
    }

    const validItems = items.filter((item) => item && textOf(item[requiredField]));
    return {
        shown: shown && validItems.length > 0,
        items: validItems,
    };
}

function safeUrl(value) {
    if (isEmptyLink(value)) {
        return '';
    }

    try {
        const url = new URL(textOf(value), window.location.href);
        return allowedUrlProtocols.includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

function splitTech(value) {
    return textOf(value)
        .split(/[,，、/|]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function createEl(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text != null && text !== '') {
        element.textContent = text;
    }
    return element;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }
    element.textContent = textOf(value);
}

function chooseInitialBackgroundIndex(backgroundCount) {
    if (!Number.isFinite(backgroundCount) || backgroundCount <= 1) {
        return 0;
    }
    return Math.floor(Math.random() * backgroundCount);
}

window.chooseInitialBackgroundIndex = chooseInitialBackgroundIndex;

function initBackgroundSlideshow(backgrounds) {
    const layers = [...document.querySelectorAll('.top-section-bg')];
    const images = Array.isArray(backgrounds) && backgrounds.length > 0
        ? backgrounds
        : defaultBackgrounds;

    if (images.length === 0 || layers.length === 0) {
        return;
    }

    let activeLayer = 0;
    let activeBackground = chooseInitialBackgroundIndex(images.length);
    layers[activeLayer].style.backgroundImage = `url("${images[activeBackground]}")`;

    if (images.length === 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    window.setInterval(() => {
        const nextLayer = activeLayer === 0 ? 1 : 0;
        activeBackground = (activeBackground + 1) % images.length;
        layers[nextLayer].style.backgroundImage = `url("${images[activeBackground]}")`;
        layers[nextLayer].classList.add('top-section-bg-active');
        layers[activeLayer].classList.remove('top-section-bg-active');
        activeLayer = nextLayer;
    }, 7000);
}

function activateScrollSpy() {
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    }
}

function bindResponsiveNavbar() {
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );

    responsiveNavItems.forEach((responsiveNavItem) => {
        responsiveNavItem.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });
}

function renderNavigation(profile) {
    const navbarItems = document.getElementById('navbar-items');
    if (!navbarItems) {
        return;
    }

    const education = getListSection(profile, '教育背景', '学校');
    const internships = getListSection(profile, '实习', '公司');
    const projects = getListSection(profile, '项目', '名称');

    const items = [
        { text: '关于', href: '#page-top' },
        education.shown ? { text: '教育', href: '#education' } : null,
        internships.shown ? { text: '实习', href: '#internships' } : null,
        projects.shown ? { text: '项目', href: '#projects' } : null,
        { text: '技能', href: '#skills' },
        { text: '联系', href: '#contact' },
    ].filter(Boolean);

    navbarItems.replaceChildren();
    items.forEach((item) => {
        const listItem = createEl('li', 'nav-item');
        const link = createEl('a', 'nav-link me-lg-3', item.text);
        link.href = item.href;
        listItem.appendChild(link);
        navbarItems.appendChild(listItem);
    });
}

function createSection(id, title, iconClass, index) {
    const section = createEl('section');
    section.id = id;
    section.className = index % 2 === 0
        ? 'bg-gradient-primary-to-secondary-light'
        : 'bg-gradient-primary-to-secondary-gray';

    const container = createEl('div', 'container px-5');
    const header = createEl('header');
    const heading = createEl('h2');
    const body = createEl('div', 'main-body');
    body.id = id + '-body';

    if (iconClass) {
        const icon = createEl('i', 'bi ' + iconClass);
        heading.appendChild(icon);
        heading.appendChild(document.createTextNode('\u00a0'));
    }
    heading.appendChild(document.createTextNode(title));

    header.appendChild(heading);
    container.appendChild(header);
    container.appendChild(body);
    section.appendChild(container);
    return { section, body };
}

function renderAbout(profile, body) {
    body.replaceChildren();

    const lead = createEl('p', '', textOf(profile['开场白']));
    body.appendChild(lead);

    const canDo = Array.isArray(profile['我会做的事']) ? profile['我会做的事'] : [];
    if (canDo.length > 0) {
        body.appendChild(createEl('h4', '', '我能做什么'));
        const list = createEl('ul');
        canDo.forEach((item) => {
            list.appendChild(createEl('li', '', textOf(item)));
        });
        body.appendChild(list);
    }

    if (textOf(profile['求职方向说明'])) {
        body.appendChild(createEl('h4', '', '求职方向'));
        body.appendChild(createEl('p', '', textOf(profile['求职方向说明'])));
    }
}

function renderEducation(items, body) {
    body.replaceChildren();

    const list = createEl('div', 'timeline-list');
    items.forEach((item) => {
        const card = createEl('div', 'timeline-item');
        const title = [textOf(item['学校']), textOf(item['学历'])].filter(Boolean).join(' · ');
        card.appendChild(createEl('h3', 'timeline-title', title));

        const metaParts = [textOf(item['专业']), textOf(item['时间'])].filter(Boolean);
        if (metaParts.length > 0) {
            card.appendChild(createEl('p', 'timeline-meta', metaParts.join(' · ')));
        }

        if (!isEmptyLink(item['说明'])) {
            card.appendChild(createEl('p', 'timeline-desc', textOf(item['说明'])));
        }

        list.appendChild(card);
    });

    body.appendChild(list);
}

function renderProjects(items, body) {
    body.replaceChildren();

    const list = createEl('div', 'project-list');
    items.forEach((project) => {
        const card = createEl('div', 'project');
        card.appendChild(createEl('h3', 'project-title', textOf(project['名称'])));

        if (textOf(project['介绍'])) {
            card.appendChild(createEl('p', 'project-desc', textOf(project['介绍'])));
        }

        const techItems = splitTech(project['技术']);
        if (techItems.length > 0) {
            const tech = createEl('p', 'project-stack');
            techItems.forEach((item) => tech.appendChild(createEl('span', '', item)));
            card.appendChild(tech);
        }

        const links = createEl('p', 'project-links');
        const demo = safeUrl(project['演示链接']);
        const code = safeUrl(project['源码链接']);

        if (demo) {
            const demoLink = createEl('a', '', '演示');
            demoLink.href = demo;
            demoLink.target = '_blank';
            demoLink.rel = 'noopener';
            links.appendChild(demoLink);
        }

        if (code) {
            const codeLink = createEl('a', '', '源码');
            codeLink.href = code;
            codeLink.target = '_blank';
            codeLink.rel = 'noopener';
            links.appendChild(codeLink);
        }

        if (links.childElementCount > 0) {
            card.appendChild(links);
        }

        list.appendChild(card);
    });

    body.appendChild(list);
}

function renderInternships(items, body) {
    body.replaceChildren();

    const list = createEl('div', 'project-list');
    items.forEach((item) => {
        const card = createEl('div', 'project');
        const title = [textOf(item['公司']), textOf(item['岗位'])].filter(Boolean).join(' · ');
        card.appendChild(createEl('h3', 'project-title', title));

        if (textOf(item['时间'])) {
            card.appendChild(createEl('p', 'timeline-meta', textOf(item['时间'])));
        }

        if (textOf(item['介绍'])) {
            card.appendChild(createEl('p', 'project-desc', textOf(item['介绍'])));
        }

        const techItems = splitTech(item['技术']);
        if (techItems.length > 0) {
            const tech = createEl('p', 'project-stack');
            techItems.forEach((entry) => tech.appendChild(createEl('span', '', entry)));
            card.appendChild(tech);
        }

        list.appendChild(card);
    });

    body.appendChild(list);
}

function renderSkills(profile, body) {
    body.replaceChildren();

    const grid = createEl('div', 'skill-grid');
    const skills = Array.isArray(profile['技能']) ? profile['技能'] : [];

    skills.forEach((skill) => {
        if (!skill || !textOf(skill['分类'])) {
            return;
        }

        const group = createEl('div', 'skill-group');
        group.appendChild(createEl('h3', '', textOf(skill['分类'])));

        const items = Array.isArray(skill['列表']) ? skill['列表'] : [];
        if (items.length > 0) {
            const list = createEl('ul');
            items.forEach((item) => list.appendChild(createEl('li', '', textOf(item))));
            group.appendChild(list);
        }

        grid.appendChild(group);
    });

    body.appendChild(grid);
}

function renderContact(profile, body) {
    body.replaceChildren();
    body.appendChild(createEl('p', '', '欢迎招聘方、合作方与同行联系，一般会尽快回复。'));

    body.appendChild(createEl('h4', '', '联系渠道'));
    const channels = createEl('ul');

    const github = safeUrl(profile['GitHub链接']);
    if (github) {
        const item = createEl('li');
        item.appendChild(document.createTextNode('GitHub：'));
        const link = createEl('a', '', github.replace(/^https?:\/\//, ''));
        link.href = github;
        link.target = '_blank';
        link.rel = 'noopener';
        item.appendChild(link);
        channels.appendChild(item);
    }

    if (textOf(profile['邮箱'])) {
        channels.appendChild(createEl('li', '', '邮箱：' + textOf(profile['邮箱'])));
    }

    if (textOf(profile['地点'])) {
        channels.appendChild(createEl('li', '', '地点：' + textOf(profile['地点'])));
    }

    body.appendChild(channels);

    if (textOf(profile['求职类型'])) {
        body.appendChild(createEl('h4', '', '可接受的岗位类型'));
        body.appendChild(createEl('p', '', textOf(profile['求职类型'])));
    }
}

function renderPage(profile) {
    const name = textOf(profile['姓名']) || '一林';
    const role = textOf(profile['职位']) || '全栈开发工程师';
    const tagline = textOf(profile['一句话介绍']);
    const github = safeUrl(profile['GitHub链接']) || 'https://github.com/yilin108';

    document.title = name + ' | ' + role;
    setText('page-top-title', name);
    setText('hero-brand', name);
    setText('top-section-bg-text', role);
    setText('hero-tagline', tagline);
    setText('copyright-text', '© ' + name + ' 2026. 保留所有权利。');

    const githubLink = document.getElementById('github-link');
    if (githubLink) {
        githubLink.textContent = 'Github';
        githubLink.href = github;
    }

    const licenseLink = document.getElementById('license-link');
    if (licenseLink) {
        const username = github.split('/').filter(Boolean).pop() || 'yilin108';
        licenseLink.textContent = '许可协议';
        licenseLink.href = 'https://github.com/' + username + '/' + username + '.github.io/blob/main/LICENSE';
    }

    const avatar = document.querySelector('#avatar img');
    if (avatar) {
        avatar.alt = name + '的头像';
    }

    const sectionsContainer = document.getElementById('sections');
    if (!sectionsContainer) {
        return;
    }
    sectionsContainer.replaceChildren();

    const education = getListSection(profile, '教育背景', '学校');
    const internships = getListSection(profile, '实习', '公司');
    const projects = getListSection(profile, '项目', '名称');
    let sectionIndex = 0;

    const about = createSection('home', '关于我', '', sectionIndex++);
    renderAbout(profile, about.body);
    sectionsContainer.appendChild(about.section);

    if (education.shown) {
        const educationSection = createSection('education', '教育背景', 'bi-mortarboard', sectionIndex++);
        renderEducation(education.items, educationSection.body);
        sectionsContainer.appendChild(educationSection.section);
    }

    if (internships.shown) {
        const internshipSection = createSection('internships', '实习经历', 'bi-briefcase', sectionIndex++);
        renderInternships(internships.items, internshipSection.body);
        sectionsContainer.appendChild(internshipSection.section);
    }

    if (projects.shown) {
        const projectsSection = createSection('projects', '项目作品', 'bi-code-slash', sectionIndex++);
        renderProjects(projects.items, projectsSection.body);
        sectionsContainer.appendChild(projectsSection.section);
    }

    const skills = createSection('skills', '技能栈', 'bi-tools', sectionIndex++);
    const contact = createSection('contact', '联系方式', 'bi-envelope-fill', sectionIndex++);

    renderSkills(profile, skills.body);
    renderContact(profile, contact.body);

    sectionsContainer.appendChild(skills.section);
    sectionsContainer.appendChild(contact.section);
}

function getBackgrounds(profile) {
    const configured = Array.isArray(profile['背景图']) ? profile['背景图'] : [];
    const images = configured
        .map((item) => textOf(item))
        .filter((item) => item && item !== '无');

    return images.length > 0 ? images : defaultBackgrounds;
}

function loadProfile() {
    return fetch(content_dir + profile_file)
        .then((response) => {
            if (!response.ok) {
                throw new Error('无法读取 ' + profile_file);
            }
            return response.text();
        })
        .then((text) => jsyaml.load(text) || {})
        .catch((error) => {
            console.log(error);
            return {};
        });
}

function markSiteReady() {
    document.body.classList.remove('site-loading');
    document.body.classList.add('site-ready');
}

window.addEventListener('DOMContentLoaded', () => {
    loadProfile()
        .then((profile) => {
            renderNavigation(profile);
            renderPage(profile);
            initBackgroundSlideshow(getBackgrounds(profile));
            activateScrollSpy();
            bindResponsiveNavbar();
        })
        .catch((error) => console.log(error))
        .finally(() => markSiteReady());
});
