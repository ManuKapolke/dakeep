import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { Note } from '../interfaces/note.interface';

@Injectable({
  providedIn: 'root'
})
export class NoteListService {

  trashNotes: Note[] = [];
  normalNotes: Note[] = [];

  // items$;
  // items;

  unsubTrash;
  unsubNotes;

  firestore: Firestore = inject(Firestore);

  constructor() {
    this.unsubTrash = this.subTrashList();
    this.unsubNotes = this.subNotesList();

    // this.unsubNotes = onSnapshot(this.getSingleDocRef('notes', '2QFVXw0siNVUFkC7ruMr'), (element) => {
    //   // ...
    // });


    // // Alternative mit 'collectionData' ("in diesem Fall nicht empfohlen"):
    // this.items$ = collectionData(this.getNotesRef());
    // this.items = this.items$.subscribe(list => {
    //   list.forEach(element => {
    //     console.log(element);
    //   });
    // });
  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id);
      await updateDoc(docRef, this.getCleanJson(note)).catch(
        err => console.error(err)
      );
    }
  }

  getCleanJson(note: Note) {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked
    };
  }

  getColIdFromNote(note: Note): 'notes' | 'trash' {
    if (note.type === 'note') {
      return 'notes';
    } else {
      return 'trash';
    }
  }

  async addNote(item: {}) {
    await addDoc(this.getNotesRef(), item).catch(
      err => console.error(err)
    ).then(
      docRef => { console.log('Document written with ID: ', docRef?.id) }
    )
  }

  ngOnDestroy() {
    this.unsubTrash();
    this.unsubNotes();

    // this.items.unsubscribe();
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = [];
      list.forEach(element => {
        // console.log('onSnapshot element:', element);
        // console.log('onSnapshot element.id:', element.id);
        // console.log('onSnapshot element.data():', element.data());
        // console.log('onSnapshot this.setNoteObject(element.data(), element.id):', this.setNoteObject(element.data(), element.id));
        this.trashNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subNotesList() {
    return onSnapshot(this.getNotesRef(), (list) => {
      this.normalNotes = [];
      list.forEach(element => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id,
      type: obj.type || 'note',
      title: obj.title || '',
      content: obj.content || '',
      marked: obj.marked || false
    }
  }

  getNotesRef() {
    return collection(this.firestore, 'notes');
  }

  getTrashRef() {
    return collection(this.firestore, 'trash');
  }

  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }
}
