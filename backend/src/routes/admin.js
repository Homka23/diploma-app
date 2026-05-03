import { Router } from 'express';
import { requireAdmin } from '../middleware/admin.js';
import {
  getTopics, createTopic, updateTopic, deleteTopic, reorderTopics,
  getLessons, createLesson, updateLesson, deleteLesson, reorderLessons,
  getBlocks, createBlock, updateBlock, deleteBlock, swapBlocks, reorderBlocks,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
  createOption, updateOption, deleteOption,
  getEarOptions, createEarOption, updateEarOption, deleteEarOption,
  getUsers, updateUserRole, toggleUserBlock,
  getPracticeTasks, createPracticeTask, updatePracticeTask, deletePracticeTask,
} from '../controllers/admin.js';

const router = Router();
router.use(requireAdmin);

// Topics
router.get   ('/topics',                    getTopics);
router.post  ('/topics',                    createTopic);
router.post  ('/topics/reorder',            reorderTopics);
router.put   ('/topics/:id',                updateTopic);
router.delete('/topics/:id',                deleteTopic);

// Lessons
router.get   ('/topics/:topicId/lessons',        getLessons);
router.post  ('/topics/:topicId/lessons',        createLesson);
router.post  ('/topics/:topicId/lessons/reorder', reorderLessons);
router.put   ('/lessons/:id',                    updateLesson);
router.delete('/lessons/:id',                    deleteLesson);

// Blocks
router.get   ('/lessons/:lessonId/blocks',  getBlocks);
router.post  ('/lessons/:lessonId/blocks',  createBlock);
router.put   ('/blocks/:blockId',           updateBlock);
router.delete('/blocks/:blockId',           deleteBlock);
router.post  ('/blocks/swap',               swapBlocks);
router.post  ('/lessons/:lessonId/blocks/reorder', reorderBlocks);

// Quiz questions
router.get   ('/blocks/:blockId/questions',         getQuestions);
router.post  ('/blocks/:blockId/questions',         createQuestion);
router.put   ('/questions/:id',                     updateQuestion);
router.delete('/questions/:id',                     deleteQuestion);

// Quiz options
router.post  ('/questions/:questionId/options',     createOption);
router.put   ('/options/:id',                       updateOption);
router.delete('/options/:id',                       deleteOption);

// Ear training options
router.get   ('/blocks/:blockId/ear-options',       getEarOptions);
router.post  ('/blocks/:blockId/ear-options',       createEarOption);
router.put   ('/ear-options/:id',                   updateEarOption);
router.delete('/ear-options/:id',                   deleteEarOption);

// Users
router.get   ('/users',           getUsers);
router.put   ('/users/:id/role',  updateUserRole);
router.put   ('/users/:id/block', toggleUserBlock);

// Practice tasks
router.get   ('/lessons/:lessonId/practice-tasks', getPracticeTasks);
router.post  ('/lessons/:lessonId/practice-tasks', createPracticeTask);
router.put   ('/practice-tasks/:id',               updatePracticeTask);
router.delete('/practice-tasks/:id',               deletePracticeTask);

export default router;
