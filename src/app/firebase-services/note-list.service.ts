import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Note } from '../interfaces/note.interface';

@Injectable({
  providedIn: 'root'
})
export class NoteListService {

  trashNotes: Note[] = [];
  normalNotes: Note[] = [];
  normalMarkedNotes: Note[] = [];

  // items$;
  // items;

  unsubTrash;
  unsubNotes;
  unsubMarkedNotes;

  firestore: Firestore = inject(Firestore);

  constructor() {
    this.unsubTrash = this.subTrashList();
    this.unsubNotes = this.subNotesList();
    this.unsubMarkedNotes = this.subMarkedNotesList();

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

  async deleteNote(colId: string, docId: string) {
    let docRef = this.getSingleDocRef(colId, docId);
    await deleteDoc(docRef).catch(
      err => console.error(err)
    );
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

  async addNote(item: Note, colId: 'notes' | 'trash') {
    let ref = (colId === 'notes') ? this.getNotesRef() : this.getTrashRef();
    await addDoc(ref, item).catch(
      err => console.error(err)
    ).then(
      docRef => { console.log('Document written with ID: ', docRef?.id) }
    )
  }

  ngOnDestroy() {
    this.unsubTrash();
    this.unsubNotes();
    this.unsubMarkedNotes();

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
    // const ref = collection(this.firestore, 'notes/5rEsvYhCR9tC2TTfvWwz/notesExtra'); // subcollection
    // const q = query(ref, orderBy('title'), limit(100));
    const q = query(this.getNotesRef(), orderBy('title'), limit(100));
    return onSnapshot(q, (list) => {
      this.normalNotes = [];
      list.forEach(element => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
      list.docChanges().forEach((change) => {
        if (change.type === "added") {
          console.log("New note: ", change.doc.data());
        }
        if (change.type === "modified") {
          console.log("Modified note: ", change.doc.data());
        }
        if (change.type === "removed") {
          console.log("Removed note: ", change.doc.data());
        }
      });
    });
  }

  subMarkedNotesList() {
    const q = query(this.getNotesRef(), where('marked', '==', true), limit(100));
    return onSnapshot(q, (list) => {
      this.normalMarkedNotes = [];
      list.forEach(element => {
        this.normalMarkedNotes.push(this.setNoteObject(element.data(), element.id));
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
