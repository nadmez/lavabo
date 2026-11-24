import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import CategoryCheckboxList from "@/components/admin/CategoryCheckboxList";

const categories = [
  { id: 1, name: "İstanbul Avize", parentId: null },
  { id: 2, name: "Modern Işık", parentId: 1 },
  { id: 3, name: "Duvar Aplik", parentId: null },
];

function Harness({ initial = [1] }) {
  const [selectedIds, setSelectedIds] = useState(initial);
  return (
    <CategoryCheckboxList
      categories={categories}
      selectedIds={selectedIds}
      onChange={setSelectedIds}
      legend="Kategoriler"
    />
  );
}

describe("CategoryCheckboxList", () => {
  it("filters names without case or Turkish diacritics", () => {
    render(<Harness />);
    const search = screen.getByRole("searchbox", { name: "Kategori ara" });

    fireEvent.change(search, { target: { value: "istanbul" } });
    expect(
      screen.getByRole("checkbox", { name: "İstanbul Avize" })
    ).toBeChecked();
    expect(
      screen.queryByRole("checkbox", { name: "Modern Işık" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Duvar Aplik" })
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "ISIK" } });
    expect(
      screen.getByRole("checkbox", { name: "Modern Işık" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "İstanbul Avize" })
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "APLİK" } });
    expect(
      screen.getByRole("checkbox", { name: "Duvar Aplik" })
    ).toBeInTheDocument();
  });

  it("keeps hidden selections and lets a filtered category be checked", () => {
    render(<Harness />);
    const search = screen.getByRole("searchbox", { name: "Kategori ara" });

    fireEvent.change(search, { target: { value: "aplik" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Duvar Aplik" }));
    fireEvent.change(search, { target: { value: "" } });

    expect(
      screen.getByRole("checkbox", { name: "İstanbul Avize" })
    ).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Duvar Aplik" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Modern Işık" })
    ).not.toBeChecked();
  });
});
