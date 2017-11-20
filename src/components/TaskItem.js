import React, { Component } from 'react'

// import { graphql } from 'react-apollo'
import { GC_USER_ID } from '../constants'
// import gql from 'graphql-tag'

const completedByText = <small> - COMPLETED BY: </small>;
const userId = localStorage.getItem(GC_USER_ID)

export default class TaskItem extends Component {
  render() {
    console.log(this.props)
    const { taskId, task, completeId, index, completeTask, deleteTask } = this.props;
    const optimistic = taskId < 0;
    const taskStyle = optimistic ? {margin: "0.3em", padding: "0.5em", background: "#efefef", opacity: "0.5", border: "1px solid #ccc"} : {margin: "0.3em", padding: "0.5em", background: "white", border: "1px solid #ccc"}
    return (
      <div key={index} style={taskStyle}>
        <input type="checkbox" style={{width: "2em"}} onChange={() => {completeTask(taskId, userId)}} value="Completed" checked={task.completed} />
        {task.description}
        {task.completed ? completedByText : null}
        {task.completed ? task.completed.user : null}
        <button style={{color: "red", float: "right", cursor: "pointer"}} onClick={() => {deleteTask(completeId, taskId)}}>x</button>
      </div>
    )
  }
}
