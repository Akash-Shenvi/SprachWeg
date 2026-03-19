"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const internshipListing_model_1 = __importDefault(require("./models/internshipListing.model"));
const env_1 = require("./config/env");
const internships = [
    {
        title: 'Software Development Intern',
        slug: 'software-development-intern',
        shortDescription: 'Build, test, and ship production-ready software with hands-on support from our engineering team.',
        description: 'Work alongside our engineering team to build, test, and deploy real-world software solutions across multiple platforms while learning how production delivery works end to end.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 9999,
        tags: ['Software', 'Internship', 'Beginner Friendly'],
        sortOrder: 1,
    },
    {
        title: 'Web Development Intern (Frontend / Backend)',
        slug: 'web-development-intern-frontend-backend',
        shortDescription: 'Build polished web interfaces and scalable APIs using modern frontend and backend tooling.',
        description: 'Gain hands-on experience building responsive web interfaces or robust server-side APIs using modern frameworks, practical workflows, and review-driven development.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 8999,
        tags: ['Web Dev', 'React', 'Node.js'],
        sortOrder: 2,
    },
    {
        title: 'Full Stack Development Intern',
        slug: 'full-stack-development-intern',
        shortDescription: 'Work across UI, APIs, and databases to understand how full products are designed and delivered.',
        description: 'Get end-to-end development exposure by designing APIs, building UI components, and integrating databases in a production-style environment.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 10999,
        tags: ['Full Stack', 'React', 'Node.js'],
        sortOrder: 3,
    },
    {
        title: 'Python Programming Intern',
        slug: 'python-programming-intern',
        shortDescription: 'Use Python for automation, scripting, backend support, and practical problem solving.',
        description: 'Apply Python to automate workflows, process data, and contribute to scripting or backend service development on practical project tasks.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 8499,
        tags: ['Python', 'Automation', 'Scripting'],
        sortOrder: 4,
    },
    {
        title: 'Java Development Intern',
        slug: 'java-development-intern',
        shortDescription: 'Learn enterprise-style Java development with structured code, APIs, and backend patterns.',
        description: 'Build enterprise-grade applications using Java and modern frameworks like Spring Boot in a collaborative engineering workflow.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 8999,
        tags: ['Java', 'Spring Boot', 'OOP'],
        sortOrder: 5,
    },
    {
        title: 'Data Analytics Intern',
        slug: 'data-analytics-intern',
        shortDescription: 'Turn data into business insights using analysis, reporting, and visualization tools.',
        description: 'Collect, clean, and analyze data to surface insights that drive decisions using tools like Python, Excel, and Power BI.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 9499,
        tags: ['Data', 'Analytics', 'Power BI'],
        sortOrder: 6,
    },
    {
        title: 'Cloud Computing Intern',
        slug: 'cloud-computing-intern',
        shortDescription: 'Deploy services, provision resources, and learn modern cloud platform workflows.',
        description: 'Get hands-on with cloud platforms such as AWS, Azure, or GCP while learning provisioning, deployment, and cloud architecture basics.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 11999,
        tags: ['Cloud', 'AWS', 'DevOps'],
        sortOrder: 7,
    },
    {
        title: 'Cyber Security Intern',
        slug: 'cyber-security-intern',
        shortDescription: 'Build security awareness through vulnerability analysis, hardening, and threat-focused tasks.',
        description: 'Learn about threat detection, vulnerability assessments, and security best practices while working on real security-focused workflows.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 11999,
        tags: ['Security', 'Networking', 'Ethical Hacking'],
        sortOrder: 8,
    },
    {
        title: 'AI & Machine Learning Intern',
        slug: 'ai-machine-learning-intern',
        shortDescription: 'Experiment with models, datasets, and pipelines across applied AI and machine learning tasks.',
        description: 'Build and experiment with ML models, explore NLP and computer vision tasks, and work with real datasets and training pipelines.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 12999,
        tags: ['AI', 'ML', 'Python', 'Deep Learning'],
        sortOrder: 9,
    },
    {
        title: 'IT Support & Systems Intern',
        slug: 'it-support-systems-intern',
        shortDescription: 'Support infrastructure, systems, and everyday operations across practical IT environments.',
        description: 'Assist with IT infrastructure, helpdesk operations, and systems administration while building a strong foundation in support workflows.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 7999,
        tags: ['IT Support', 'Networking', 'Systems'],
        sortOrder: 10,
    },
    {
        title: 'PLC Automation Engineer',
        slug: 'plc-automation-engineer',
        shortDescription: 'Learn PLC programming and industrial automation through hands-on technical exposure.',
        description: 'Learn to design and program programmable logic controllers for industrial automation systems and processes with applied project guidance.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 14999,
        tags: ['PLC', 'Automation', 'Industrial'],
        sortOrder: 11,
    },
    {
        title: 'Controls & Automation Engineer',
        slug: 'controls-automation-engineer',
        shortDescription: 'Work on control systems and automation logic for manufacturing and industrial use cases.',
        description: 'Gain experience in control systems engineering by implementing automated workflows for manufacturing and industrial applications.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 14999,
        tags: ['Controls', 'Automation', 'Engineering'],
        sortOrder: 12,
    },
    {
        title: 'PLC Programmer (Automation)',
        slug: 'plc-programmer-automation',
        shortDescription: 'Focus on PLC logic, HMI workflows, and industrial troubleshooting in real scenarios.',
        description: 'Develop and troubleshoot PLC logic and HMI interfaces for industrial machinery while learning structured automation delivery.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 14999,
        tags: ['PLC', 'Programming', 'Automation'],
        sortOrder: 13,
    },
    {
        title: 'Industrial Automation Engineer',
        slug: 'industrial-automation-engineer',
        shortDescription: 'Explore the full lifecycle of industrial automation from design through testing and rollout.',
        description: 'Work across the lifecycle of industrial automation projects, from system design to testing and deployment in field-oriented environments.',
        duration: '3-6 Months',
        location: 'Remote / Hybrid / Onsite',
        price: 15999,
        tags: ['Industrial', 'Automation', 'IIoT'],
        sortOrder: 14,
    },
];
const seedInternships = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(env_1.env.MONGO_URI);
        console.log('Connected to MongoDB');
        yield internshipListing_model_1.default.deleteMany({
            slug: { $in: internships.map((internship) => internship.slug) },
        });
        console.log('Cleared existing internship listings');
        yield internshipListing_model_1.default.insertMany(internships);
        console.log('Database seeded with internship listings');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding internships:', error);
        process.exit(1);
    }
});
seedInternships();
