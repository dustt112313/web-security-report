import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Plus, Trash2 } from "lucide-react";
import { ApplicationInfoSectionProps } from "../types";

export function ApplicationInfoSection({
  applicationInfoRows,
  addApplicationInfoRow,
  removeApplicationInfoRow,
  updateApplicationInfoRow
}: ApplicationInfoSectionProps) {

  const handleBlur = (id: string, value: string) => {
    updateApplicationInfoRow(id, value, true); // shouldCallAPI = true
  };

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium pl-2">
        4. Trong quá trình khảo sát và kiểm tra đánh giá an ninh mạng ứng dụng, chúng tôi xác định được một số thông tin về các ứng dụng được đánh giá như sau:
      </h3>
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label>Danh sách thông tin xác định được</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addApplicationInfoRow}
                className="h-7 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Thêm dòng
              </Button>
            </div>
          
          <Table>
            <TableHeader>
              {/* <TableRow>
                <TableHead className="w-16 h-8 px-2 py-1"></TableHead>
                <TableHead className="flex-1 h-8 px-2 py-1">Thông tin</TableHead>
                <TableHead className="w-20 h-8 px-2 py-1"></TableHead>
              </TableRow> */}
            </TableHeader>
            <TableBody>
              {applicationInfoRows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center font-medium px-2 py-1">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <Input
                      value={row.info}
                      onChange={(e) => updateApplicationInfoRow(row.id, e.target.value, false)} // shouldCallAPI = false
                      onBlur={(e) => handleBlur(row.id, e.target.value)}
                      placeholder="Nhập thông tin"
                      className="border-0 p-1 h-7 focus:ring-1 focus:ring-blue-500"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeApplicationInfoRow(row.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}