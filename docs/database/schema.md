# 数据库结构文档

生成时间: 2026/2/18 21:31:19

项目: ProjectFlow2

Supabase URL: https://ghhvdffsyvzkhbftifzy.supabase.co

总表数: 19

---

## 表列表

1. [app_users](#app_users)
2. [app_courses](#app_courses)
3. [app_assignments](#app_assignments)
4. [app_class_sessions](#app_class_sessions)
5. [app_attendance](#app_attendance)
6. [app_course_enrollments](#app_course_enrollments)
7. [app_announcements](#app_announcements)
8. [app_community_posts](#app_community_posts)
9. [app_simulation_scenarios](#app_simulation_scenarios)
10. [app_tools](#app_tools)
11. [app_notifications](#app_notifications)
12. [app_learning_paths](#app_learning_paths)
13. [app_achievements](#app_achievements)
14. [app_user_achievements](#app_user_achievements)
15. [app_user_badges](#app_user_badges)
16. [app_polls](#app_polls)
17. [app_poll_votes](#app_poll_votes)
18. [app_questions](#app_questions)
19. [app_events](#app_events)

---

## app_users

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "u-admin-01" |
| email | string | "admin@company.com" |
| name | string | "Admin User" |
| role | string | "SuperAdmin" |
| status | string | "正常" |
| department | string | "IT部" |
| avatar | string | "https://images.unsplash.com/photo-1560250097-0b93 |
| created_at | string | "2025-12-29T17:24:56.994169+00:00" |
| subscription_tier | string | "pro" |
| xp | number | 0 |
| streak | number | 0 |
| ai_tier | string | "none" |
| ai_daily_used | number | 0 |
| ai_daily_reset_at | object | null |
| completed_courses_count | number | 0 |
| membership_expires_at | object | null |
| is_lifetime_member | boolean | false |
| teacher_license_url | object | null |
| teacher_verified_at | object | null |
| teacher_verified_by | object | null |
| institution_name | object | null |
| institution_code | object | null |
| job_title | object | null |

## app_courses

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "c-sys-001" |
| category | string | "Course" |
| title | string | "项目全生命周期管理实战" |
| author | string | "项目管理中心" |
| description | string | "从项目启动到收尾的端到端管理体系，涵盖五大过程组与十大知识领域在企业内部的落地实践。" |
| image | string | "https://images.unsplash.com/photo-1519389950473-4 |
| status | string | "Published" |
| duration | string | "12h 30m" |
| views | number | 0 |
| chapters | object | [{"type":"video","title":"第1章：项目启动与立项","duration": |
| resources | object | [{"url":"#","name":"项目管理手册_V3.0.pdf","size":"15MB" |
| created_at | string | "2025-12-29T17:24:56.994169+00:00" |
| rating | number | 4.5 |
| last_update | object | null |
| kb_node_ids | object | [] |
| learning_path_order | object | null |
| category_color | object | null |

## app_assignments

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "2ed360f0-3e21-44da-b0f9-6569d234b7e7" |
| title | string | "项目计划书撰写" |
| content | string | "撰写一份完整的项目计划书" |
| course_id | string | "c-sys-001" |
| teacher_id | string | "340f28b9-8557-4e6f-adbf-e2abb1543ec2" |
| deadline | string | "2026-02-25T09:42:58.956+00:00" |
| max_score | number | 100 |
| attachments | object | [] |
| status | string | "pending" |
| submitted_count | number | 0 |
| total_count | number | 5 |
| created_at | string | "2026-02-18T09:43:01.303691+00:00" |
| updated_at | string | "2026-02-18T09:43:01.303691+00:00" |
| is_deleted | boolean | false |
| deleted_at | object | null |

## app_class_sessions

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "4c2cdfb7-7030-4928-ab03-fae6062253ed" |
| course_id | string | "c-sys-001" |
| teacher_id | string | "340f28b9-8557-4e6f-adbf-e2abb1543ec2" |
| title | string | "项目管理基础 - 第1讲" |
| description | object | null |
| classroom | object | null |
| scheduled_start | string | "2026-02-16T18:42:59.257+00:00" |
| scheduled_end | string | "2026-02-16T19:42:59.257+00:00" |
| actual_start | object | null |
| actual_end | object | null |
| duration | object | null |
| status | string | "completed" |
| max_students | number | 30 |
| recording_enabled | boolean | false |
| recording_started_at | object | null |
| recording_ended_at | object | null |
| recording_duration | object | null |
| recording_url | object | null |
| recording_file_size | object | null |
| recording_status | object | null |
| screen_share_enabled | boolean | false |
| screen_share_started_at | object | null |
| screen_share_ended_at | object | null |
| whiteboard_data | object | [] |
| attendance_count | number | 0 |
| question_count | number | 0 |
| poll_count | number | 0 |
| engagement_score | object | null |
| created_at | string | "2026-02-18T09:43:02.236585+00:00" |
| updated_at | string | "2026-02-18T09:43:02.236585+00:00" |

## app_attendance

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "93ca02a6-d948-4789-ac85-6b7485f3c2eb" |
| session_id | string | "4c2cdfb7-7030-4928-ab03-fae6062253ed" |
| student_id | string | "23d45360-290b-4c65-b5da-d55a00ad6d5b" |
| status | string | "present" |
| check_in_time | string | "2026-02-17T18:58:24.581+00:00" |
| check_out_time | object | null |
| device_type | object | null |
| device_name | object | null |
| ip_address | object | null |
| user_agent | object | null |
| location_lat | object | null |
| location_lng | object | null |
| location_accuracy | object | null |
| notes | object | null |
| created_at | string | "2026-02-18T09:43:02.566282+00:00" |
| updated_at | string | "2026-02-18T09:43:02.566282+00:00" |

## app_course_enrollments

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "ea828798-2048-4e29-bb93-5dd6cf58b128" |
| student_id | string | "u-student-001" |
| course_id | string | "c-teacher-001" |
| enrolled_at | string | "2026-01-25T06:30:50.086+00:00" |
| enrolled_by | object | null |
| status | string | "active" |
| last_accessed_at | object | null |
| completion_date | object | null |
| final_score | object | null |

## app_announcements

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "7b660ee2-703a-4b15-9a5e-30f55387e7fc" |
| title | string | "欢迎使用 ProjectFlow 项目管理学习平台！" |
| content | string | "亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：\r\n• 学习专业的项目管理课程\r |
| type | string | "success" |
| priority | number | 10 |
| target_audience | string | "all" |
| is_active | boolean | true |
| start_at | string | "2026-01-01T00:00:00+00:00" |
| end_at | string | "2026-03-01T00:00:00+00:00" |
| created_by | object | null |
| created_at | string | "2026-01-01T00:00:00+00:00" |
| updated_at | string | "2026-02-15T18:55:22.406565+00:00" |

## app_community_posts

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | number | 1 |
| user_id | string | "u-alex-demo" |
| user_name | string | "Alex Chen" |
| user_avatar | string | "https://images.unsplash.com/photo-1599566150163-2 |
| role | string | "Student" |
| content | string | "终于拿到了 PMP 证书！🎉 感谢 Michael 老师的课程，特别是关于风险管理的那一章，在实 |
| image | object | null |
| tags | object | ["PMP","备考心得","ProjectManagement"] |
| likes | number | 128 |
| comments | number | 45 |
| created_at | string | "2025-12-30T03:24:13.281365+00:00" |
| is_pinned | boolean | false |

## app_simulation_scenarios

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "a5d48778-ea84-432e-a90e-0bbdc5307fef" |
| title | string | "项目危机处理" |
| description | string | "模拟项目中突发危机的应对决策，测试你的危机管理能力" |
| difficulty | string | "Hard" |
| category | string | "Crisis Management" |
| cover_image | string | "https://images.unsplash.com/photo-1552664730-d307 |
| stages | object | [{"id":"stage-1","title":"危机发现","context":"你是一名项目经 |
| decisions | object | [] |
| resources | object | {} |
| learning_objectives | object | ["危机管理","冲突解决","进度压缩","团队管理"] |
| is_published | boolean | true |
| created_at | string | "2026-02-14T16:48:21.347225+00:00" |
| updated_at | string | "2026-02-14T16:48:21.347225+00:00" |
| estimated_time | number | 15 |
| completion_count | number | 0 |

## app_tools

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "91ea8a8c-96f4-4515-9c7a-c23463b109db" |
| name | string | "蒙特卡洛模拟器" |
| description | string | "基于PERT分布的风险量化分析，10,000次模拟预测项目完成概率" |
| category | string | "risk" |
| icon | string | "Calculator" |
| config | object | {} |
| is_active | boolean | true |
| required_tier | string | "pro" |
| difficulty | string | "Medium" |
| usage_count | number | 0 |
| created_at | string | "2026-02-14T17:07:27.018314+00:00" |
| updated_at | string | "2026-02-14T17:07:27.018314+00:00" |

## app_notifications

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| （表为空，无法推断结构） | - | "-" |

## app_learning_paths

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| （表为空，无法推断结构） | - | "-" |

## app_achievements

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "40b9016b-d957-4cf1-976c-66df45e84047" |
| code | string | "pmp_master" |
| name | string | "PMP大师" |
| description | string | "完成全部体系课程" |
| icon | string | "Trophy" |
| category | string | "learning" |
| unlock_type | string | "courses_completed" |
| unlock_threshold | number | 12 |
| unlock_condition | object | {} |
| rarity | string | "legendary" |
| is_hidden | boolean | false |
| created_at | string | "2026-02-14T19:41:59.679329+00:00" |

## app_user_achievements

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "076418c3-fe8e-4af2-a59b-f2f5c245efc0" |
| user_id | string | "test-pro-001" |
| achievement_id | string | "bf8216bd-e406-4e04-ac89-8b71be718ead" |
| unlocked_at | string | "2026-01-27T13:54:42.003501+00:00" |
| progress | number | 100 |
| is_new | boolean | false |

## app_user_badges

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "4bd87c5e-8d63-4c60-9022-42d43255ec74" |
| user_id | string | "test-pp-001" |
| badge_id | string | "pmp_master" |
| badge_name | string | "PMP大师" |
| badge_icon | string | "Crown" |
| badge_color | string | "text-yellow-600" |
| badge_bg | string | "bg-yellow-100" |
| condition | string | "通过PMP模拟考试且分数>85" |
| unlocked_at | string | "2026-02-09T16:48:21.347225+00:00" |

## app_polls

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| （表为空，无法推断结构） | - | "-" |

## app_poll_votes

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| （表为空，无法推断结构） | - | "-" |

## app_questions

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| （表为空，无法推断结构） | - | "-" |

## app_events

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | number | 1 |
| user_id | string | "u-stu-01" |
| title | string | "每日敏捷站会" |
| start_time | string | "09:00 AM" |
| duration | string | "15min" |
| type | string | "meeting" |
| created_at | string | "2025-12-30T05:06:59.845281+00:00" |

