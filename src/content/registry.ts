/**
 * Every piece of editable website text. `default` is what the site shows until the owner changes
 * it in Studio > Site Content (overrides live in the portfolio_site_content table).
 */
export type FieldType = 'text' | 'textarea' | 'lines' | 'url' | 'image'

export interface ContentField {
  key: string
  label: string
  type: FieldType
  default: string
  hint?: string
}

export interface ContentGroup {
  id: string
  title: string
  description?: string
  fields: ContentField[]
}

const f = (key: string, label: string, def: string, type: FieldType = 'text', hint?: string): ContentField => ({
  key,
  label,
  type,
  default: def,
  hint,
})

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: 'site',
    title: 'Brand & page info',
    description: 'Your logo name, browser tab title, search description and the footer copyright line.',
    fields: [
      f('site.wordmark', 'Logo name (header and footer)', 'Oluwaseyi.'),
      f('site.title', 'Browser tab title', 'Oluwaseyi - AI Automation & Web Development'),
      f(
        'site.description',
        'Search engine description',
        'Oluwaseyi — AI Automation, Website Design & Development. I build AI-powered business systems, automate workflows, and design and develop modern websites and web applications.',
        'textarea',
      ),
      f('site.copyright', 'Footer copyright text (year is added automatically)', 'Oluwaseyi. All rights reserved.'),
    ],
  },
  {
    id: 'nav',
    title: 'Header & menu',
    description: 'Navigation labels, the Services dropdown and the Let’s Talk button.',
    fields: [
      f('nav.services', 'Services menu label', 'Services'),
      f('nav.work', 'Link: AI work', 'Work'),
      f('nav.process', 'Link: Process', 'Process'),
      f('nav.about', 'Link: About', 'About'),
      f('nav.contact', 'Link: Contact', 'Contact'),
      f('nav.cta', 'Header button', 'Let\'s Talk'),
      f('nav.service1.title', 'Dropdown item 1: title', 'AI Automation'),
      f('nav.service1.subtitle', 'Dropdown item 1: subtitle', 'Workflows, AI agents & business automation'),
      f('nav.service2.title', 'Dropdown item 2: title', 'Web Design & Development'),
      f('nav.service2.subtitle', 'Dropdown item 2: subtitle', 'Websites, landing pages & web applications'),
      f('nav.dropdown.title', 'Dropdown footer: heading', 'Like What You See?'),
      f('nav.dropdown.subtitle', 'Dropdown footer: text', 'Let\'s connect & build something.'),
      f('nav.dropdown.mobileNote', 'Mobile dropdown footer text', 'Let\'s build something together.'),
      f('nav.dropdown.button', 'Dropdown footer button', 'Get Started'),
    ],
  },
  {
    id: 'hero',
    title: 'Home: top section',
    fields: [
      f('hero.label', 'Small label above the headline', 'AI Automation & Web Development'),
      f('hero.headline1', 'Headline line 1', 'I build systems'),
      f('hero.headline2', 'Headline line 2 (shown in grey)', 'that work for'),
      f('hero.headline3', 'Headline line 3', 'your business.'),
      f(
        'hero.paragraph',
        'Supporting paragraph',
        'I combine automation tools, AI agents, and modern web technologies to help businesses streamline operations, improve customer experiences, and bring digital ideas to life.',
        'textarea',
      ),
      f('hero.cta1', 'Primary button', 'See My Work'),
      f('hero.cta2', 'Second button', 'Let\'s Talk'),
      f('hero.pill1.label', 'Side box 1: small label', 'Service 01'),
      f('hero.pill1.title', 'Side box 1: title', 'AI Automation'),
      f('hero.pill2.label', 'Side box 2: small label', 'Service 02'),
      f('hero.pill2.title', 'Side box 2: title', 'Web Design & Dev'),
      f('hero.skills', 'Skills heading', 'Skills'),
      f('hero.skillsMore', 'Text after the skills', 'and more...'),
      f('hero.scroll', 'Scroll hint', 'Scroll to explore'),
    ],
  },
  {
    id: 'services',
    title: 'Services section',
    fields: [
      f('services.eyebrow', 'Small label', 'What I Do'),
      f('services.heading1', 'Heading line 1', 'Two areas.'),
      f('services.heading2', 'Heading line 2', 'One focus.'),
      f('services.1.number', 'Service 1: number', '01'),
      f('services.1.title', 'Service 1: title', 'AI Automation'),
      f(
        'services.1.description',
        'Service 1: description',
        'I design and build automated workflows and AI-powered business systems that connect tools, reduce repetitive manual work, and improve operational consistency.',
        'textarea',
      ),
      f(
        'services.1.capabilities',
        'Service 1: bullet points',
        [
          'n8n workflow automation',
          'AI agents & customer communication',
          'Appointment & follow-up automation',
          'CRM & lead-management workflows',
          'Email, form, calendar & database integrations',
        ].join('\n'),
        'lines',
        'One bullet per line.',
      ),
      f('services.2.number', 'Service 2: number', '02'),
      f('services.2.title', 'Service 2: title', 'Website Design & Development'),
      f(
        'services.2.description',
        'Service 2: description',
        'I design and develop modern, responsive websites and web applications with a focus on clear user experiences, thoughtful layouts, and practical functionality.',
        'textarea',
      ),
      f(
        'services.2.capabilities',
        'Service 2: bullet points',
        [
          'Business websites & landing pages',
          'Responsive web applications & dashboards',
          'Modern design and implementation',
        ].join('\n'),
        'lines',
        'One bullet per line.',
      ),
    ],
  },
  {
    id: 'ai',
    title: 'AI Automation work section',
    description: 'The heading area. Individual projects are edited in the Portfolio Projects tab.',
    fields: [
      f('ai.eyebrow', 'Small label', 'AI Automation Work'),
      f('ai.heading1', 'Heading line 1', 'Workflows that run'),
      f('ai.heading2', 'Heading line 2', 'while you focus.'),
      f(
        'ai.intro',
        'Intro paragraph',
        'A catalogue of automation systems built to reduce manual work, improve consistency, and connect business tools — each designed around a specific operational challenge.',
        'textarea',
      ),
    ],
  },
  {
    id: 'web',
    title: 'Web design work section',
    description: 'The heading area. Individual projects are edited in the Portfolio Projects tab.',
    fields: [
      f('web.eyebrow', 'Small label', 'Web Design & Development'),
      f('web.heading', 'Heading', 'Web Design & Development Portfolio — See What I\'ve Built'),
      f(
        'web.intro',
        'Intro paragraph',
        'From business websites and landing pages to e-commerce stores and web applications — modern, responsive digital experiences focused on design, usability, and functionality.',
        'textarea',
      ),
      f('carousel.viewProject', 'Project link label (both sections)', 'View Project'),
    ],
  },
  {
    id: 'process',
    title: 'Process section',
    fields: [
      f('process.eyebrow', 'Small label', 'How I Work'),
      f('process.heading1', 'Heading line 1', 'A clear process,'),
      f('process.heading2', 'Heading line 2', 'every time.'),
      ...[
        ['Understand the goal', 'I start by understanding the business goal, the user needs and the constraints, before writing a single line of code or automation logic.'],
        ['Plan the solution', 'I plan a clear solution and choose the right tools for the job. I avoid over-engineering and focus on what will actually work.'],
        ['Design the experience', "Whether it's a workflow or a website, I design the experience before building, mapping out the flow, the layout, and the edge cases."],
        ['Build & integrate', 'I build, integrate, and refine the solution, connecting the pieces, testing each integration, and making sure the system holds together.'],
        ['Test & refine', "I test key flows, responsiveness, and error handling. I don't mark something done until it behaves reliably under real conditions."],
        ['Document honestly', "I document the result honestly — what works, what's in progress, and what comes next. No inflated claims, no missing steps."],
      ].flatMap(([title, desc], i) => [
        f(`process.${i + 1}.title`, `Step ${i + 1}: title`, title),
        f(`process.${i + 1}.description`, `Step ${i + 1}: description`, desc, 'textarea'),
      ]),
    ],
  },
  {
    id: 'about',
    title: 'About section',
    description: 'Your skills row is edited in the Skills tab.',
    fields: [
      f('about.eyebrow', 'Small label', 'About'),
      f('about.heading', 'Heading', 'Who I am.'),
      f(
        'about.lead',
        'Large lead statement',
        'I build AI-powered business systems, automate workflows, and design and develop modern websites and web applications.',
        'textarea',
      ),
      f(
        'about.p1',
        'Paragraph 1',
        'My work spans two areas that compliment each other: automation that removes friction from business operations, and website design and development that delivers clear, usable digital experiences to the people those businesses serve.',
        'textarea',
      ),
      f(
        'about.p2',
        'Paragraph 2',
        'I work directly with businesses to understand the actual goals before choosing a tool or writing a line of code.',
        'textarea',
      ),
    ],
  },
  {
    id: 'contact',
    title: 'Contact section & form',
    fields: [
      f('contact.eyebrow', 'Small label', 'Get in Touch'),
      f('contact.heading1', 'Heading line 1', 'Let\'s work'),
      f('contact.heading2', 'Heading line 2', 'together.'),
      f(
        'contact.intro',
        'Intro paragraph',
        'Have a project in mind, want to automate a workflow, or need a new website? Send a message and I\'ll get back to you.',
        'textarea',
      ),
      f('contact.placeholderName', 'Name placeholder', 'Your name'),
      f('contact.placeholderEmail', 'Email placeholder', 'you@example.com'),
      f('contact.placeholderMessage', 'Message placeholder', 'Briefly tell me what you would like help with, for example a website or a workflow you want to automate.', 'textarea'),
      f('contact.labelName', 'Form label: name', 'Name'),
      f('contact.labelEmail', 'Form label: email', 'Email'),
      f('contact.labelMessage', 'Form label: message', 'Message'),
      f('contact.socials', 'Socials heading', 'Socials'),
      f('contact.button', 'Send button', 'Send Message'),
      f('contact.sending', 'Send button while sending', 'Sending…'),
      f('contact.successTitle', 'Success box: title', 'Message received.'),
      f('contact.successText', 'Success box: message', 'Thank you for reaching out, I will be in touch shortly.', 'textarea'),
      f('contact.successButton', 'Success box: button', 'Send Another Message'),
    ],
  },
  {
    id: 'footer',
    title: 'Footer & social links',
    description: 'Set the label and the link for each. Use mailto:you@example.com for email.',
    fields: [
      f('footer.github.label', 'Link 1: label', 'GitHub'),
      f('footer.github.url', 'Link 1: address', 'https://github.com/OluwaseyiLabs', 'url'),
      f('footer.linkedin.label', 'Link 2: label', 'LinkedIn'),
      f('footer.linkedin.url', 'Link 2: address', 'https://www.linkedin.com/in/oluwaseyidavid8/', 'url'),
      f('footer.tiktok.label', 'Link 3: label', 'TikTok'),
      f('footer.tiktok.url', 'Link 3: address', 'https://www.tiktok.com/@oluwaseyidavid8', 'url'),
      f('footer.email.label', 'Link 4: label', 'Email'),
      f('footer.email.url', 'Link 4: address', 'mailto:Oluwaseyidavid406@gmail.com', 'url'),
      f('footer.backToTop', 'Back to top label', 'Back to top'),
    ],
  },
  {
    id: 'profile',
    title: 'Profile card (bottom of each project page)',
    description: 'Your photo, name and email with the "Available for work" line. Leave the status blank to hide that line.',
    fields: [
      f('profile.photo', 'Photo', '', 'image', 'A square photo works best. Without one, your initial is shown.'),
      f('profile.name', 'Name', 'Oluwaseyi'),
      f('profile.email', 'Email address (the Get in touch button opens this)', 'Oluwaseyidavid406@gmail.com'),
      f('profile.status', 'Status line', 'Available for work'),
      f('profile.cta', 'Button text', 'Get in touch'),
    ],
  },
  {
    id: 'project',
    title: 'Project page labels',
    description: 'Fixed words on each project page. The project content itself is edited per project.',
    fields: [
      f('project.back', 'Back link', 'Back'),
      f('project.year', 'Label: year', 'Year'),
      f('project.role', 'Label: role', 'Role'),
      f('project.platform', 'Label: platform', 'Platform'),
      f('project.tools', 'Label: tools', 'Tools'),
      f('project.toolsMore', 'Text after tool names', 'and more...'),
      f('project.visitSite', 'Button: web project', 'Visit live website'),
      f('project.visitDemo', 'Button: AI project', 'View live demo'),
      f('project.allProjects', 'Bottom link', 'All projects'),
      f('project.notFoundTitle', 'Not found: title', 'Project not found'),
      f('project.notFoundText', 'Not found: message', 'It may have been unpublished or the link may be wrong.'),
      f('project.notFoundButton', 'Not found: button', 'Back to projects'),
    ],
  },
]

export const DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_GROUPS.flatMap((g) => g.fields.map((fld) => [fld.key, fld.default])),
)
