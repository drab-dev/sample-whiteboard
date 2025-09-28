import { Router, Response } from 'express';
import { requireAuth, requireWhiteboardAccess, AuthRequest } from '../auth.js';
import { Database } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Get all whiteboards for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const whiteboards = await Database.getWhiteboardsForUser(req.user!.id);
    
    // Get collaborators for each whiteboard
    const whiteboardsWithCollaborators = await Promise.all(
      whiteboards.map(async (whiteboard) => {
        const collaborators = await Database.getWhiteboardCollaborators(whiteboard.id);
        return {
          ...whiteboard,
          collaborators: collaborators.map(c => ({
            name: c.users.name,
            email: c.users.email,
            permission: c.permission
          }))
        };
      })
    );

    res.json(whiteboardsWithCollaborators);
  } catch (error) {
    console.error('Get whiteboards error:', error);
    res.status(500).json({ error: 'Failed to fetch whiteboards' });
  }
});

// Create new whiteboard
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const user = req.user!;

    const whiteboard = await Database.createWhiteboard(
      title || 'Untitled Whiteboard',
      user.id,
      user.organization_id
    );

    res.status(201).json(whiteboard);
  } catch (error) {
    console.error('Create whiteboard error:', error);
    res.status(500).json({ error: 'Failed to create whiteboard' });
  }
});

// Get specific whiteboard
router.get('/:id', requireWhiteboardAccess('viewer'), async (req: AuthRequest, res: Response) => {
  try {
    const whiteboard = await Database.getWhiteboard(req.params.id);
    const collaborators = await Database.getWhiteboardCollaborators(req.params.id);
    
    res.json({
      ...whiteboard,
      collaborators: collaborators.map(c => ({
        name: c.users.name,
        email: c.users.email,
        permission: c.permission
      }))
    });
  } catch (error) {
    console.error('Get whiteboard error:', error);
    res.status(500).json({ error: 'Failed to fetch whiteboard' });
  }
});

// Update whiteboard title
router.patch('/:id/title', requireWhiteboardAccess('editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const whiteboard = await Database.updateWhiteboardTitle(req.params.id, title);
    res.json(whiteboard);
  } catch (error) {
    console.error('Update title error:', error);
    res.status(500).json({ error: 'Failed to update title' });
  }
});

// Update whiteboard content
router.patch('/:id/content', requireWhiteboardAccess('editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const whiteboard = await Database.updateWhiteboardContent(req.params.id, content);
    res.json(whiteboard);
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Delete whiteboard (owner only)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const whiteboard = await Database.getWhiteboard(req.params.id);
    
    if (whiteboard.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the owner can delete this whiteboard' });
    }

    await Database.deleteWhiteboard(req.params.id);
    res.json({ message: 'Whiteboard deleted successfully' });
  } catch (error) {
    console.error('Delete whiteboard error:', error);
    res.status(500).json({ error: 'Failed to delete whiteboard' });
  }
});

// Share whiteboard
router.post('/:id/share', async (req: AuthRequest, res: Response) => {
  try {
    const { email, permission } = req.body;
    const whiteboardId = req.params.id;
    
    // Check if current user is owner
    const whiteboard = await Database.getWhiteboard(whiteboardId);
    if (whiteboard.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the owner can share this whiteboard' });
    }

    // Find user by email
    const user = await Database.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add permission
    const permissionRecord = await Database.addWhiteboardPermission(whiteboardId, user.id, permission);
    
    res.json({
      message: 'Whiteboard shared successfully',
      permission: permissionRecord
    });
  } catch (error) {
    console.error('Share whiteboard error:', error);
    res.status(500).json({ error: 'Failed to share whiteboard' });
  }
});

// Get share links for whiteboard
router.get('/:id/share-links', requireWhiteboardAccess('editor'), async (req: AuthRequest, res: Response) => {
  try {
    const shareLinks = await Database.getWhiteboardShareLinks(req.params.id);
    res.json(shareLinks);
  } catch (error) {
    console.error('Get share links error:', error);
    res.status(500).json({ error: 'Failed to fetch share links' });
  }
});

// Create share link
router.post('/:id/share-links', requireWhiteboardAccess('editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { permission } = req.body;
    const shareLink = await Database.createShareLink(req.params.id, permission);
    res.json(shareLink);
  } catch (error) {
    console.error('Create share link error:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Delete share link
router.delete('/:id/share-links/:linkId', requireWhiteboardAccess('editor'), async (req: AuthRequest, res: Response) => {
  try {
    await Database.deleteShareLink(req.params.linkId);
    res.json({ message: 'Share link deleted successfully' });
  } catch (error) {
    console.error('Delete share link error:', error);
    res.status(500).json({ error: 'Failed to delete share link' });
  }
});

export default router;