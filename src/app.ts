import { Observable, Observer, Subject } from 'rxjs'
import {
  createTodoItem,
  mockToggle,
  mockHttpPost,
  search,
  HttpResponse
} from './lib'
import { FileUploader } from './FileUploader'

const $input = <HTMLInputElement>document.querySelector('.todo-val')
const $list = <HTMLUListElement>document.querySelector('.list-group')
const $add = document.querySelector('.button-add')

// 监听用户input事件
const type$ = Observable.fromEvent<KeyboardEvent>($input, 'keydown')
  .do(e=> console.log(e,"按输入框事1件"))
  .publish()
  .refCount()

  //监听用户按下回车事件
const enter$ = type$
  .filter(r => r.keyCode === 13)
  .do(r => console.log(r,"按下回车获取事件"))

const clickAdd$ = Observable.fromEvent<MouseEvent>($add, 'click')
const input$ = enter$.merge(clickAdd$)

const clearInputSubject$ = new Subject<void>()

//按下回车map节点类比于 Array 的 Map : [ … KeyboardEvent ] => [… HTMLElement 
//首先在输入回车的时候把 KeyboardEvent map 到 string, filter 掉空值
const item$ = input$
  .map(() => $input.value)
  .filter(r => r !== '')
  .distinct(null, clearInputSubject$)
  .switchMap(mockHttpPost)
  .map(createTodoItem)
  //将map出来的节点插入dom
  .do((ele: HTMLLIElement) => {
    $list.appendChild(ele)
    $input.value = ''
    clearInputSubject$.next()
  })
  .do(r => console.log(r,"转换"))
  .publishReplay(1)
  .refCount()

const toggle$ = item$.mergeMap($todoItem => {
  return Observable.fromEvent<MouseEvent>($todoItem, 'click')
    .debounceTime(300)
    .filter(e => e.target === $todoItem)
    .mapTo({
      data: {
        _id: $todoItem.dataset['id'],
        isDone: $todoItem.classList.contains('done')
      }, $todoItem
    })
  })
  .switchMap(result => {
    return mockToggle(result.data._id, result.data.isDone)
      .mapTo(result.$todoItem)
  })
  .do(($todoItem: HTMLElement) => {
    if ($todoItem.classList.contains('done')) {
      $todoItem.classList.remove('done')
    } else {
      $todoItem.classList.add('done')
    }
  })

const remove$ = item$.mergeMap($todoItem => {
  const $removeButton = $todoItem.querySelector('.button-remove')
  return Observable.fromEvent($removeButton, 'click')
    .mapTo($todoItem)
})
  .do(($todoItem: HTMLElement) => {
    // 从 DOM 上移掉 todo item
    const $parent = $todoItem.parentNode
    $parent.removeChild($todoItem)
  })

const search$ = type$.debounceTime(200)
  .filter(evt => evt.keyCode !== 13)
  .map(result => (<HTMLInputElement>result.target).value)
  .switchMap(search)
  .do((result: HttpResponse | null) => {
    const actived = document.querySelectorAll('.active')
    Array.prototype.forEach.call(actived, (item: HTMLElement) => {
      item.classList.remove('active')
    })
    if (result) {
      const item = document.querySelector(`.todo-item-${result._id}`)
      item.classList.add('active')
    }
  })

const uploader = new FileUploader()

const app$ = toggle$.merge(remove$, search$, uploader.uploadStream$)
  .do(r => {
    console.log(r)
  })

app$.subscribe()
