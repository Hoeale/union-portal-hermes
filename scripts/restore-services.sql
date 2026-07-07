-- 恢复被删除的办事服务数据
-- 使用方法: cat scripts/restore-services.sql | mysql -u用户名 -p密码 数据库名
-- 本地测试: Get-Content scripts\restore-services.sql | mysql -uroot -p1234 union_portal

-- 恢复"困难职工申报"（如果不存在）
INSERT INTO services (_id, title, description, process, requirements, isActive, order_index, created_at)
SELECT '4e1019c9-3c99-4923-bc8f-94c94fbe2b88', '困难职工申报', '困难帮扶申请', '', '', 1, 6, NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE _id = '4e1019c9-3c99-4923-bc8f-94c94fbe2b88');

-- 恢复"更多服务敬请期待"（如果不存在）
INSERT INTO services (_id, title, description, process, requirements, isActive, order_index, created_at)
SELECT '540f745a-9587-460f-a4da-940f0f16f59a', '更多服务敬请期待', '查看全部服务项目', '', '', 1, 7, NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE _id = '540f745a-9587-460f-a4da-940f0f16f59a');

SELECT '恢复完成' AS result;
