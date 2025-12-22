import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SkillCourse from './models/skillCourse.model';
import LanguageCourse from './models/languageCourse.model';

dotenv.config({ path: '/home/sovirtraining/.env' });

const languageCourses = [
    {
        title: 'German Language Training',
        subtitle: 'Master practical German for relocation, university study, and workplace integration in Germany.',
        category: 'Language',
        description: 'A complete German program focusing on real-life communication, visa interviews, and integration scenarios.',
        image: 'german-course.jpg',
        popular: true,
        levels: [
            {
                name: 'A1',
                duration: '45 Hours',
                price: '₹15,999',
                features: [
                    'Alphabet & pronunciation',
                    'Greetings & daily expressions',
                    'Numbers, dates, time',
                    'Articles & plurals',
                    'Present tense verbs & sentence structure',
                    'Questions & negation',
                    'Daily life conversations',
                    'Reading simple texts',
                    'Writing short sentences'
                ],
                outcome: 'Basic spoken German; can introduce self; ready for Goethe A1'
            },
            {
                name: 'A2',
                duration: '60 Hours',
                price: '₹18,999',
                features: [
                    'Past tense (Perfekt)',
                    'Modal verbs',
                    'Prepositions & connectors',
                    'Describing experiences/opinions',
                    'Telephone & email communication',
                    'Reading short articles',
                    'Writing structured paragraphs',
                    'Listening practice'
                ],
                outcome: 'Improved fluency; ready for Goethe A2'
            },
            {
                name: 'B1',
                duration: '90 Hours',
                price: '₹20,999',
                features: [
                    'Advanced grammar (Nebensätze)',
                    'Formal/informal communication',
                    'Opinion & arguments',
                    'Professional vocabulary',
                    'Essay & email writing',
                    'Newspapers & longer texts',
                    'Real-life audio comprehension',
                    'Presentations'
                ],
                outcome: 'Work/Ausbildung preparation; ready for Goethe B1',
                examPrep: {
                    title: 'Goethe / TELC B2',
                    details: 'Advanced exam preparation for university and professional certification',
                    price: '₹43,499'
                }
            }
        ]
    },
    {
        title: 'Japanese Language Training',
        subtitle: 'Learn Japanese from N5 to N2 with structured grammar, kanji, and speaking practice tailored to JLPT.',
        category: 'Language',
        description: 'A JLPT-focused track that balances exam preparation with real-life conversational Japanese.',
        image: 'japanese-course.jpg',
        popular: true,
        levels: [
            {
                name: 'N5',
                duration: '50 Hours',
                price: '₹17,999',
                features: [
                    'Hiragana & Katakana mastery',
                    'Basic Kanji (50+ characters)',
                    'Pronunciation fundamentals',
                    'Simple grammar & particles',
                    'Daily conversation practice',
                    'Numbers, dates, time',
                    'Reading basic sentences',
                    'Writing short texts'
                ],
                outcome: 'Ready for JLPT N5 certification'
            },
            {
                name: 'N4',
                duration: '80 Hours',
                price: '₹21,999',
                features: [
                    'Intermediate grammar patterns',
                    'Kanji mastery (300+ characters)',
                    'Past & polite forms',
                    'Daily life & travel vocabulary',
                    'Listening comprehension',
                    'Reading paragraphs',
                    'Writing structured answers',
                    'Conversation practice'
                ],
                outcome: 'Ready for JLPT N4 certification'
            },
            {
                name: 'N3',
                duration: '150 Hours',
                price: '₹32,999',
                features: [
                    'Advanced grammar patterns',
                    'Kanji mastery (650+ characters)',
                    'Formal/informal speech distinction',
                    'Workplace Japanese',
                    'News & article reading',
                    'Essay writing skills',
                    'Speaking drills',
                    'Cultural communication'
                ],
                outcome: 'Ready for JLPT N3 certification'
            }
        ]
    },
    {
        title: 'English Language Training',
        subtitle: 'Develop fluent, confident English for global workplaces, universities, and international opportunities.',
        category: 'Language',
        description: 'A structured English program focused on speaking, writing, and comprehension for professional and academic success.',
        image: 'english-course.jpg',
        popular: true,
        levels: [
            {
                name: 'Beginner',
                duration: '40 Hours',
                price: '₹9,999',
                features: [
                    'Basic grammar',
                    'Vocabulary building',
                    'Pronunciation practice',
                    'Daily conversation skills',
                    'Reading simple texts',
                    'Writing basic sentences'
                ],
                outcome: 'Build foundation in English communication'
            },
            {
                name: 'Intermediate',
                duration: '60 Hours',
                price: '₹13,999',
                features: [
                    'Advanced grammar structures',
                    'Speaking fluency practice',
                    'Listening comprehension',
                    'Writing emails & paragraphs',
                    'Group discussions',
                    'Business vocabulary'
                ],
                outcome: 'Communicate confidently in professional settings'
            },
            {
                name: 'Advanced',
                duration: '90 Hours',
                price: '₹18,999',
                features: [
                    'Professional communication',
                    'Public speaking skills',
                    'Business English mastery',
                    'Interview preparation',
                    'Advanced writing techniques',
                    'Leadership communication'
                ],
                outcome: 'Master professional English for global careers',
                examPrep: {
                    title: 'Exam Preparation',
                    details: 'IELTS / Business English',
                    price: '₹19,999'
                }
            }
        ]
    }
];

const skillCourses: any[] = [
    {
        title: 'PLC Industrial Automation',
        subtitle: 'Master Programmable Logic Controllers (PLC) for industrial automation.',
        category: 'Technical',
        description: 'Comprehensive training on PLC programming, troubleshooting, and integration.',
        image: 'plc-course.jpg',
        popular: true,
        features: ['Hands-on training', 'Real-world projects', 'Certification'],
        price: '₹17800',
        duration: '56 hours (7 weeks)',
        mode: 'Online / Offline / Hybrid'
    },
    {
        title: 'SCADA & HMI Training',
        subtitle: 'Learn Supervisory Control and Data Acquisition systems.',
        category: 'Technical',
        description: 'In-depth course on SCADA systems and Human Machine Interface (HMI) design.',
        image: 'scada-course.jpg',
        popular: false,
        features: ['System Design', 'Data Visualization', 'Alarm Management'],
        price: '₹13800',
        duration: '40 hours (5 weeks)',
        mode: 'Online / Offline / Hybrid'
    },
    {
        title: 'Industrial Drives & Motion Control',
        subtitle: 'Expertise in VFDs, servo motors, and motion control systems.',
        category: 'Technical',
        description: 'Training on installation, configuration, and maintenance of industrial drives.',
        image: 'drives-course.jpg',
        popular: false,
        features: ['VFD Configuration', 'Motion Profiles', 'Maintenance'],
        price: '₹18800',
        duration: '45 hours (5 weeks)',
        mode: 'Online / Offline / Hybrid'
    },
    {
        title: 'Advanced Industry 4.0',
        subtitle: 'Future-proof your skills with Industry 4.0 technologies.',
        category: 'Technical',
        description: 'Learn about IIoT, smart factories, and digital transformation in manufacturing.',
        image: 'industry4-course.jpg',
        popular: true,
        features: ['IIoT', 'Smart Sensors', 'Cloud Integration'],
        price: '₹28000',
        duration: '50 hours (6 weeks)',
        mode: 'Online / Offline / Hybrid'
    },
    {
        title: 'Customized Corporate Training',
        subtitle: 'Tailored training solutions for your organization.',
        category: 'Corporate',
        description: 'Customized training programs to meet specific business needs and goals.',
        image: 'corporate-course.jpg',
        popular: false,
        features: ['Custom Curriculum', 'On-site Training', 'Team Building'],
        price: '₹28000',
        duration: 'Flexible (Client-based)',
        mode: 'On-site / Online / Hybrid'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sprachweg');
        console.log('Connected to MongoDB');

        // Clear existing Language courses
        await LanguageCourse.deleteMany({ title: { $in: languageCourses.map(c => c.title) } });
        console.log('Cleared existing language courses');

        // Insert Language courses
        await LanguageCourse.insertMany(languageCourses);
        console.log('Database seeded with language courses!');

        // Optional: Manage Skill courses separately (keeping existing logic mostly intact but clearing mixed ones)
        // For now, if we assume skill courses were mixed, we should probably remove the "Language" ones from SkillCourse collection
        await SkillCourse.deleteMany({ category: 'Language' });
        console.log('Removed language courses from SkillCourse collection to avoid duplicates');

        // If there are skill courses to seed:
        if (skillCourses.length > 0) {
            await SkillCourse.deleteMany({ title: { $in: skillCourses.map(c => c.title) } });
            await SkillCourse.insertMany(skillCourses);
            console.log('Database seeded with skill courses!');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
