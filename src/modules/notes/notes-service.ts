import type { NoteDto } from '../../shared/contracts/api';
import { NotFoundError } from '../../platform/errors/app-error';
import { NotesRepository } from './notes-repository';

export class NotesService {
  constructor(private readonly notesRepository: NotesRepository) {}

  getNotes(videoId: number): NoteDto {
    if (!this.notesRepository.findVideo(videoId)) {
      throw new NotFoundError(`Video with id ${videoId}`);
    }

    const notes = this.notesRepository.findNotes(videoId);
    return {
      videoId,
      content: notes?.content ?? '',
    };
  }

  saveNotes(videoId: number, content: string): NoteDto {
    if (!this.notesRepository.findVideo(videoId)) {
      throw new NotFoundError(`Video with id ${videoId}`);
    }

    this.notesRepository.saveNotes(videoId, content);
    return this.getNotes(videoId);
  }
}
