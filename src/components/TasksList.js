import React, { Component } from 'react'
import TaskItem from './TaskItem'

import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

export class TasksList extends Component{

  render() {
    if (this.props.tasksQuery && this.props.tasksQuery.loading) {
      return <div>Loading</div>
    }

    if (this.props.tasksQuery && this.props.tasksQuery.error) {
      return <div>Error</div>
    }
    const tasksToRender = this.props.tasksQuery.allTasks
    return (
      <div>
        <div>
          {tasksToRender && tasksToRender.map((task, index) => {
            if (!task) {
              return null;
            }
            const completeId = (task.completed) ? task.completed.id : null;
            const taskId = (task.id) ? task.id : null;
            return (
              <TaskItem key={task.id} deleteTask={this.props.deleteTask} completeTask={this.props.completeTask} taskId={taskId} completeId={completeId} task={task}/>
            )
          })}
        </div>
      </div>
    )

  }
}

export const ALL_TASKS_QUERY = gql`
  query AllTasksQuery {
    allTasks {
        id
        description
        completed {
          id
          user
        }
        postedBy {
          id
        }
      }
    }
  `

export default graphql(ALL_TASKS_QUERY, { name: 'AllTasksQuery' })(TasksList)
